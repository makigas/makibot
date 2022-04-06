import { GuildMember, Role, Snowflake, User } from "discord.js";
import Makibot from "../Makibot";
import { getLevelV2 } from "./karma";
import logger from "./logger";
import Server from "./server";
import TagBag from "./tagbag";

export interface KarmaStats {
  messages: number;
  upvotes: number;
  downvotes: number;
  stars: number;
  hearts: number;
  waves: number;
  offset: number;
  points: number;
  level: number;
  total: number;
  version: string;
}

export default class Member {
  private guildMember: GuildMember;

  readonly server: Server;

  private _tagbag: TagBag;

  constructor(guildMember: GuildMember) {
    this.guildMember = guildMember;
    this.server = new Server(this.guildMember.guild);
  }

  get user(): User {
    return this.guildMember.user;
  }

  private hasRole(role: Role | null | undefined): boolean {
    return this.guildMember.roles.cache.some((r: Role) => r.id === role?.id);
  }

  private async setRole(role: Role, value: boolean): Promise<boolean> {
    if (value) {
      await this.guildMember.roles.add(role);
    } else {
      await this.guildMember.roles.remove(role);
    }
    return value;
  }

  get client(): Makibot {
    return this.guildMember.client as Makibot;
  }

  get id(): Snowflake {
    return this.guildMember.user.id;
  }

  get usertag(): string {
    return this.guildMember.user.tag;
  }

  get avatar(): string {
    return this.guildMember.user.avatarURL();
  }

  get tagbag(): TagBag {
    if (!this._tagbag) {
      const client: Makibot = this.guildMember.client as Makibot;
      this._tagbag = new TagBag(client.provider, this.guildMember.id, this.guildMember.guild);
    }
    return this._tagbag;
  }

  get moderator(): boolean {
    return this.hasRole(this.server.modsRole);
  }

  get warned(): boolean {
    return this.hasRole(this.server.warnRole);
  }

  get muted(): boolean {
    return this.hasRole(this.server.muteRole);
  }

  get helper(): boolean {
    return this.hasRole(this.server.helperRole);
  }

  get crew(): boolean {
    const tiers = this.server.karmaTiersRole;
    return Object.values(tiers).some((id) => this.hasRole(id));
  }

  get canPostLinks(): boolean {
    return !this.hasRole(this.server.linksDisabledRole);
  }

  async getKarma(): Promise<KarmaStats> {
    const results = await Promise.all([
      this.client.karma.count(this.id),
      this.client.karma.count(this.id, { kind: "message" }),
      this.client.karma.count(this.id, { kind: "upvote" }),
      this.client.karma.count(this.id, { kind: "downvote" }),
      this.client.karma.count(this.id, { kind: "star" }),
      this.client.karma.count(this.id, { kind: "heart" }),
      this.client.karma.count(this.id, { kind: "wave" }),
    ]);
    const [total, messages, upvotes, downvotes, stars, hearts, waves] = results;
    const offset = await this.tagbag.tag("karma:offset").get(0);
    const level = await this.tagbag.tag("karma:level").get(0);
    const version = await this.tagbag.tag("karma:ver").get<string>("v1");
    const points = offset + total;

    /* Upgrade to the latest version of the karma formula. */
    if (version !== "v2" && level > 0) {
      logger.info("[upgrading karma for this person]");
      await this.upgradeKarma();
      return this.getKarma();
    }

    return {
      downvotes,
      hearts,
      level,
      messages,
      offset,
      points,
      stars,
      upvotes,
      waves,
      total,
      version,
    };
  }

  async upgradeKarma(): Promise<void> {
    const version = await this.tagbag.tag("karma:ver").get<string>("v1");

    if (version === "v1") {
      /* Upgrade to v2. */
      const total = await this.client.karma.count(this.id);
      const offset = await this.tagbag.tag("karma:offset").get(0);
      const points = total + offset;

      const levelV2 = getLevelV2(points);
      await this.tagbag.tag("karma:level").set(levelV2);
      await this.tagbag.tag("karma:max").set(levelV2);
      await this.tagbag.tag("karma:ver").set("v2");
      await this.setCrew(levelV2);
    }
  }

  async setMuted(value: boolean): Promise<boolean> {
    return this.setRole(this.server.muteRole, value);
  }

  async setModerator(value: boolean): Promise<boolean> {
    return this.setRole(this.server.modsRole, value);
  }

  async setCrew(level: number): Promise<boolean> {
    const tiers = await this.server.karmaTiersRole();

    if (Object.keys(tiers).length == 0) {
      /* Return if the server doesn't have configured any tier. */
      return false;
    }

    /* Get the tier this user should be in. (If none, will return 0). */
    const assignableLevel = Object.keys(tiers).reduce((current, tierLevel) => {
      if (parseInt(tierLevel) > level) {
        /* Skip tiers that require more level. */
        return current;
      } else {
        /* Get the maximum: either this new level or the level we already have. */
        return parseInt(tierLevel) > current ? tierLevel : current;
      }
    }, 0);

    Object.keys(tiers).forEach(async (level) => {
      const shouldHaveThisLevel = parseInt(level) == assignableLevel;

      const tierTag = this.tagbag.tag("karma:tier:" + level);
      const inThisTierTag = await tierTag.get(false);
      const actuallyHasTier = this.hasRole(tiers[level]);
      if (!shouldHaveThisLevel && (inThisTierTag || actuallyHasTier)) {
        this.setRole(tiers[level], false);
        await tierTag.set(false);
      } else if (shouldHaveThisLevel && (!inThisTierTag || !actuallyHasTier)) {
        this.setRole(tiers[level], true);
        await tierTag.set(true);
      }
    });

    return true;
  }

  async setWarned(value: boolean): Promise<boolean> {
    return this.setRole(this.server.warnRole, value);
  }

  async setHelper(value: boolean): Promise<boolean> {
    return this.setRole(this.server.helperRole, value);
  }

  async kick(): Promise<void> {
    if (this.guildMember.kickable) {
      await this.guildMember.kick();
    }
  }

  /**
   * Forget any flag previously set by any hook or interaction in regard to the
   * mod system. For instance, calling bless() will forget whether the member
   * ever triggered the antispam system or how many times has the antiflood
   * system been triggered recently.
   */
  async bless(): Promise<void> {
    const tags = [
      "antispam:trippedAt",
      "antiflood:pings",
      "antiflood:history",
      "antiflood:history2",
      "antiflood:floods",
    ];
    await Promise.all(tags.map((t) => this.tagbag.tag(t).delete()));
  }

  async ban(reason?: string): Promise<void> {
    if (this.guildMember.bannable) {
      this.guildMember.ban({
        reason,
      });
    }
  }

  async tripAntispam(): Promise<void> {
    /* Put the current timestamp. */
    await this.tagbag.tag("antispam:trippedAt").set(Date.now());
  }

  async trippedAntispam(): Promise<boolean> {
    const tag = await this.tagbag.tag("antispam:trippedAt").get(0);
    const sevenDaysAgo = Date.now() - 7 * 86400 * 1000;
    return tag >= sevenDaysAgo;
  }
}
