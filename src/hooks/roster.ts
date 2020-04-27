import { GuildMember } from "discord.js";

import Hook from "./hook";
import Makibot from "../Makibot";
import { JoinModlogEvent, LeaveModlogEvent } from "../lib/modlog";
import Server from "../lib/server";

/**
 * The roster service plugs hooks whenever an user leaves the guild.
 * It is designed to send to modlog announcements whenever an user leaves the
 * server to let the server operators know about that.
 */
export default class RosterService implements Hook {
  constructor(client: Makibot) {
    client.on("guildMemberAdd", (member) => this.memberJoin(member));
    client.on("guildMemberRemove", (member) => this.memberLeft(member));
  }

  /**
   * This event is triggered whenever an user joins the guild server.
   * @param member the member that has joined the server.
   */
  private memberJoin(member: GuildMember): void {
    const server = new Server(member.guild);
    const modlog = server.modlogChannel;
    if (modlog) {
      modlog
        .send(new JoinModlogEvent(member).toDiscordEmbed())
        .catch((e) => console.error(`Error: ${e}`));
    }
  }

  /**
   * This event is triggered whenever an user leaves the guild server.
   * @param member the member that has left the server.
   */
  private memberLeft(member: GuildMember): void {
    const server = new Server(member.guild);
    const modlog = server.modlogChannel;
    if (modlog) {
      modlog
        .send(new LeaveModlogEvent(member).toDiscordEmbed())
        .catch((e) => console.error(`Error: ${e}`));
    }
  }
}
