import { Guild, GuildMember, MessageEmbedOptions, PartialGuildMember } from "discord.js";
import { Hook } from "../lib/hook";
import logger from "../lib/logger";
import { createModlogNotification } from "../lib/modlog/notifications";
import Server from "../lib/server";
import { dateIdentifier, userIdentifier } from "../lib/utils/format";

export const createJoinEvent = (member: GuildMember): MessageEmbedOptions => ({
  color: 0xfeaf40,
  author: {
    name: "Nuevo miembro del servidor",
    iconURL:
      "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/247/bright-button_1f506.png",
  },
  description: [
    `**Usuario**: ${userIdentifier(member.user)}`,
    `**Se unió a Discord**: ${dateIdentifier(member.user.createdAt)}`,
  ].join("\n"),
});

export const createLeaveEvent = (member: PartialGuildMember): MessageEmbedOptions => ({
  color: 0xdd3247,
  author: {
    name: "Abandono del servidor",
    iconURL:
      "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/247/cross-mark_274c.png",
  },
  description: [
    `**Usuario**: ${userIdentifier(member.user)}`,
    `**Se unió a Discord**: ${dateIdentifier(member.user.createdAt)}`,
  ].join("\n"),
});

export const createNicknameEvent = (
  oldMember: GuildMember,
  newMember: GuildMember
): MessageEmbedOptions => ({
  color: 0xffda84,
  author: {
    name: "Cambio de nickname local",
    iconURL:
      "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/322/label_1f3f7-fe0f.png",
  },
  description: [
    `**Usuario**: ${userIdentifier(newMember.user)}`,
    oldMember.nickname
      ? `**Anterior nickname**: ${oldMember.nickname}`
      : "Antes no tenía nickname local",
    newMember.nickname
      ? `**Nuevo nickname**: ${newMember.nickname}`
      : "Ahora no tiene nickname local",
  ].join("\n"),
});

async function sendEvent(guild: Guild, embed: MessageEmbedOptions): Promise<void> {
  try {
    const server = new Server(guild);
    await server.sendToModlog("default", {
      username: embed.author.name,
      avatarURL: embed.author.iconURL,
      embeds: [embed],
    });
  } catch (e) {
    logger.error(`[roster] error during event handling`, e);
  }
}

/**
 * The roster sends announces to the modlog channel as a result of some events,
 * such as members joining or leaving the server, or members being banned, in the
 * interest of moderators to read.
 */
export default class RosterService implements Hook {
  name = "roster";

  async onGuildMemberJoin(member: GuildMember): Promise<void> {
    logger.debug(`[roster] announcing join for ${member.user.tag}`);
    const event = createModlogNotification(createJoinEvent(member));
    return sendEvent(member.guild, event);
  }

  async onGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    logger.debug(`[roster] evaluating member changes`);
    const promises = [];
    if (oldMember.nickname != newMember.nickname) {
      /* The member has changed nicknames. */
      logger.debug(`[roster] has: changed nickname`);
      const event = createNicknameEvent(oldMember, newMember);
      promises.push(sendEvent(newMember.guild, event));
    }
    await Promise.all(promises);
  }

  async onGuildMemberLeave(member: PartialGuildMember): Promise<void> {
    logger.debug(`[roster] announcing leave for ${member.user.tag}`);
    const event = createModlogNotification(createLeaveEvent(member));
    return sendEvent(member.guild, event);
  }
}
