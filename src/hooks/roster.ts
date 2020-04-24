import { Guild, GuildMember, TextChannel } from "discord.js";

import Hook from "./hook";
import Makibot from "../Makibot";
import { JoinModlogEvent, LeaveModlogEvent } from "../lib/modlog";

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
  private memberJoin(member: GuildMember) {
    let modlog = this.getModlog(member.guild);
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
  private memberLeft(member: GuildMember) {
    let modlog = this.getModlog(member.guild);
    if (modlog) {
      modlog
        .send(new LeaveModlogEvent(member).toDiscordEmbed())
        .catch((e) => console.error(`Error: ${e}`));
    }
  }

  /**
   * Resolve and get the channel to use as modlog channel in this guild.
   * @param guild the guild to get the modlog channel from.
   */
  private getModlog(guild: Guild): TextChannel | null {
    /* If a modlog ID is not registered, there is no modlog. */
    if (!process.env.MODLOG) {
      return null;
    }

    /* Find a guild channel with such ID. */
    if (guild.channels.exists("id", process.env.MODLOG)) {
      let channel = guild.channels.find("id", process.env.MODLOG);
      return channel.type == "text" ? <TextChannel>channel : null;
    } else {
      return null;
    }
  }
}
