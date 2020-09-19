import { GuildMember, Guild, User } from "discord.js";

import Hook from "./hook";
import Makibot from "../Makibot";
import { JoinModlogEvent, LeaveModlogEvent, BanModlogEvent } from "../lib/modlog";
import Server from "../lib/server";

/**
 * The roster sends announces to the modlog channel as a result of some events,
 * such as members joining or leaving the server, or members being banned, in the
 * interest of moderators to read.
 */
export default class RosterService implements Hook {
  constructor(client: Makibot) {
    client.on("guildMemberAdd", (member) => this.memberJoin(member));
    client.on("guildMemberRemove", (member) => this.memberLeft(member));
    client.on("guildBanAdd", (guild, user) => this.memberBan(guild, user));
  }

  private async memberBan(guild: Guild, user: User): Promise<void> {
    try {
      const server = new Server(guild);
      await server.logModlogEvent(new BanModlogEvent(user));
    } catch (e) {
      console.error(`Roster error for Ban: ${e}`);
    }
  }

  private async memberJoin(member: GuildMember): Promise<void> {
    try {
      const server = new Server(member.guild);
      await server.logModlogEvent(new JoinModlogEvent(member));
    } catch (e) {
      console.error(`Roster error for Join: ${e}`);
    }
  }

  private async memberLeft(member: GuildMember): Promise<void> {
    try {
      const server = new Server(member.guild);
      await server.logModlogEvent(new LeaveModlogEvent(member));
    } catch (e) {
      console.error(`Roster error for Leave: ${e}`);
    }
  }
}
