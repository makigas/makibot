import { GuildMember, Guild, User, PartialGuildMember } from "discord.js";

import { Hook } from "../lib/hook";
import Makibot from "../Makibot";
import { JoinModlogEvent, LeaveModlogEvent, BanModlogEvent } from "../lib/modlog";
import Server from "../lib/server";
import logger from "../lib/logger";

async function resolvePartial(member: GuildMember | PartialGuildMember): Promise<GuildMember> {
  if (member.partial) {
    return member.fetch();
  } else {
    return member as GuildMember;
  }
}

/**
 * The roster sends announces to the modlog channel as a result of some events,
 * such as members joining or leaving the server, or members being banned, in the
 * interest of moderators to read.
 */
export default class RosterService implements Hook {
  name = "roster";

  constructor(client: Makibot) {
    client.on("guildMemberAdd", (member) => this.memberJoin(member));
    client.on("guildMemberRemove", (member) =>
      resolvePartial(member).then((member) => this.memberLeft(member))
    );
    client.on("guildBanAdd", (ban) => this.memberBan(ban.guild, ban.user));
  }

  private async memberBan(guild: Guild, user: User): Promise<void> {
    logger.debug(`[roster] announcing ban for ${user.tag}`);
    try {
      const server = new Server(guild);
      await server.logModlogEvent(new BanModlogEvent(user));
    } catch (e) {
      console.error(`Roster error for Ban: ${e}`);
    }
  }

  private async memberJoin(member: GuildMember): Promise<void> {
    logger.debug(`[roster] announcing join for ${member.user.tag}`);
    try {
      const server = new Server(member.guild);
      await server.logModlogEvent(new JoinModlogEvent(member));
    } catch (e) {
      console.error(`Roster error for Join: ${e}`);
    }
  }

  private async memberLeft(member: GuildMember): Promise<void> {
    logger.debug(`[roster] announcing leave for ${member.user.tag}`);
    try {
      const server = new Server(member.guild);
      await server.logModlogEvent(new LeaveModlogEvent(member));
    } catch (e) {
      console.error(`Roster error for Leave: ${e}`);
    }
  }
}
