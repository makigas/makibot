import { GuildMember, Role } from "discord.js";
import Makibot from "../Makibot";
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
  points: number;
  level: number;
  total: number;
}

export default class Member {
  private guildMember: GuildMember;

  private server: Server;

  private _tagbag: TagBag;

  constructor(guildMember: GuildMember) {
    this.guildMember = guildMember;
    this.server = new Server(this.guildMember.guild);
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

  get id(): string {
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

  get verified(): boolean {
    return this.hasRole(this.server.verifiedRole);
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

  get cooldown(): boolean {
    if (!this.guildMember.joinedAt) {
      /* TODO: Investigate why THIS happens. */
      console.warn(`Warning! ${this.guildMember.user.tag} join date is not available`);
      return true;
    }

    const minutesSinceJoined = Date.now() - this.guildMember.joinedAt.getTime();
    return minutesSinceJoined > 60 * 1000 * 5;
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
    const offset = this.tagbag.tag("karma:offset").get(0);
    const level = this.tagbag.tag("karma:level").get(1);
    const points = offset + total;

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
    };
  }

  async setVerification(value: boolean): Promise<boolean> {
    return this.setRole(this.server.verifiedRole, value);
  }

  async setMuted(value: boolean): Promise<boolean> {
    return this.setRole(this.server.muteRole, value);
  }

  async setModerator(value: boolean): Promise<boolean> {
    return this.setRole(this.server.modsRole, value);
  }

  async setCrew(level: number): Promise<boolean> {
    const tiers = this.server.karmaTiersRole;

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
      if (!shouldHaveThisLevel && tierTag.get(false)) {
        this.setRole(tiers[level], false);
        await tierTag.set(false);
      } else if (shouldHaveThisLevel && !tierTag.get(false)) {
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
}
