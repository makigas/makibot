import { GuildMember, Role } from "discord.js";
import Server from "./server";

export default class Member {
  private guildMember: GuildMember;

  private server: Server;

  constructor(guildMember: GuildMember) {
    this.guildMember = guildMember;
    this.server = new Server(this.guildMember.guild);
  }

  private hasRole(role: Role | null | undefined): boolean {
    return this.guildMember.roles.has(role?.id);
  }

  private async setRole(role: Role, value: boolean): Promise<boolean> {
    if (value) {
      await this.guildMember.addRole(role);
    } else {
      await this.guildMember.removeRole(role);
    }
    return value;
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

  get cooldown(): boolean {
    if (!this.guildMember.joinedAt) {
      /* TODO: Investigate why THIS happens. */
      console.warn(`Warning! ${this.guildMember.user.tag} join date is not available`);
      return true;
    }

    const minutesSinceJoined = Date.now() - this.guildMember.joinedAt.getTime();
    return minutesSinceJoined > 60 * 1000 * 5;
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
