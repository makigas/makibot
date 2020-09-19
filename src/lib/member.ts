import { GuildMember } from "discord.js";
import Server from "./server";

export default class Member {
  private guildMember: GuildMember;

  private server: Server;

  constructor(guildMember: GuildMember) {
    this.guildMember = guildMember;
    this.server = new Server(this.guildMember.guild);
  }

  get verified(): boolean {
    return this.guildMember.roles.has(this.server.verifiedRole?.id);
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

  async setVerification(value: boolean) {
    if (value) {
      await this.guildMember.addRole(this.server.verifiedRole);
    } else {
      await this.guildMember.removeRole(this.server.verifiedRole);
    }
  }
}
