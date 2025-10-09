import { GuildMember, Role, Snowflake, User } from "discord.js";
import Makibot from "../Makibot";
import { getLevelV2 } from "./karma";
import logger from "./logger";
import Server from "./server";
import TagBag from "./tagbag";

interface KarmaStats {
  messages: number;
  upvotes: number;
  downvotes: number;
  stars: number;
  hearts: number;
  waves: number;
  offset: number;
  loots: number;
  points: number;
  level: number;
  total: number;
  version: string;
  last: number;
}

export default class Member {
  private guildMember: GuildMember;

  readonly server: Server;

  readonly tagbag: TagBag;

  constructor(guildMember: GuildMember) {
    this.guildMember = guildMember;
    this.server = new Server(this.guildMember.guild);
    const client: Makibot = this.guildMember.client as Makibot;
    this.tagbag = new TagBag(client.provider, this.guildMember.id, this.guildMember.guild);
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

  get moderator(): boolean {
    return this.hasRole(this.server.modsRole);
  }

  async getKarma(): Promise<KarmaStats> {
    const results = await Promise.all([
      this.client.karma.count(this.id),
      this.client.karma.count(this.id, { kind: "message" }),
      this.client.karma.count(this.id, { kind: "upvote" }),
      this.client.karma.count(this.id, { kind: "downvote" }),
      this.client.karma.count(this.id, { kind: "star" }),
      this.client.karma.count(this.id, { kind: "heart" }),
      this.client.karma.count(this.id, { kind: "loots" }),
      this.client.karma.count(this.id, { kind: "wave" }),
      this.client.karma.lastInteraction(this.id),
    ]);
    const [total, messages, upvotes, downvotes, stars, hearts, loots, waves, last] = results;
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
      loots,
      total,
      version,
      last,
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
      await this.setKarmaVanityLevel(levelV2);
    }
  }

  async setKarmaVanityLevel(level: number): Promise<boolean> {
    const tiers = await this.server.karmaTiersRole();

    if (Object.keys(tiers).length == 0) {
      /* Return if the server doesn't have configured any tier. */
      return false;
    }

    /* Get the tier this user should be in. (If none, will return 0). */
    const assignableLevel = Object.keys(tiers).reduce((current, tierLevelStr) => {
      const tierLevel = parseInt(tierLevelStr);
      if (tierLevel > level) {
        /* Skip tiers that require more level. */
        return current;
      } else {
        /* Get the maximum: either this new level or the level we already have. */
        return tierLevel > current ? tierLevel : current;
      }
    }, 0);

    Object.keys(tiers).forEach(async (levelStr) => {
      const level = parseInt(levelStr);
      const shouldHaveThisLevel = level == assignableLevel;

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
}
