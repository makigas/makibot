import { GuildBan, GuildMember, PartialGuildMember } from "discord.js";

import { Hook } from "../lib/hook";
import { JoinModlogEvent, LeaveModlogEvent, BanModlogEvent } from "../lib/modlog";
import Server from "../lib/server";
import logger from "../lib/logger";

/**
 * The roster sends announces to the modlog channel as a result of some events,
 * such as members joining or leaving the server, or members being banned, in the
 * interest of moderators to read.
 */
export default class RosterService implements Hook {
  name = "roster";

  async onGuildMemberBan({ guild, user }: GuildBan): Promise<void> {
    logger.debug(`[roster] announcing ban for ${user.tag}`);
    try {
      const server = new Server(guild);
      await server.logModlogEvent(new BanModlogEvent(user));
    } catch (e) {
      logger.error(`[roster] error for ban: ${e}`);
    }
  }

  async onGuildMemberJoin(member: GuildMember): Promise<void> {
    logger.debug(`[roster] announcing join for ${member.user.tag}`);
    try {
      const server = new Server(member.guild);
      await server.logModlogEvent(new JoinModlogEvent(member));
    } catch (e) {
      logger.error(`[roster] error for join: ${e}`);
    }
  }

  async onGuildMemberLeave(member: PartialGuildMember): Promise<void> {
    logger.debug(`[roster] announcing leave for ${member.user.tag}`);
    try {
      const server = new Server(member.guild);
      await server.logModlogEvent(new LeaveModlogEvent(member));
    } catch (e) {
      logger.error(`[roster] error for leave ${e}`);
    }
  }
}
