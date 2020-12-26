import { GuildMember, Role } from "discord.js";
import Makibot from "../Makibot";
import Karma from "./karma";
import Server from "./server";
import TagBag from "./tagbag";

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

  get trusted(): boolean {
    return this.hasRole(this.server.trustedRole);
  }

  get warned(): boolean {
    return this.hasRole(this.server.warnRole);
  }

  get helper(): boolean {
    return this.hasRole(this.server.helperRole);
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

  get karma(): Karma {
    return new Karma(this.guildMember);
  }

  async setVerification(value: boolean): Promise<boolean> {
    return this.setRole(this.server.verifiedRole, value);
  }

  async setModerator(value: boolean): Promise<boolean> {
    return this.setRole(this.server.modsRole, value);
  }

  async setWarned(value: boolean): Promise<boolean> {
    return this.setRole(this.server.warnRole, value);
  }

  async setHelper(value: boolean): Promise<boolean> {
    return this.setRole(this.server.helperRole, value);
  }
}
