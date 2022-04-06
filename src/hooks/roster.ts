import {
  Guild,
  GuildBan,
  GuildMember,
  MessageEmbedOptions,
  PartialGuildMember,
  User,
} from "discord.js";
import { Hook } from "../lib/hook";
import logger from "../lib/logger";
import { createModlogNotification, notifyModlog } from "../lib/modlog/notifications";
import { ModEvent } from "../lib/modlog/types";
import Server from "../lib/server";
import { dateIdentifier, userIdentifier } from "../lib/utils/format";
import Makibot from "../Makibot";

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

export const createTimeoutEvent = (
  member: GuildMember,
  reason?: string,
  source?: User,
  until?: Date
): MessageEmbedOptions => ({
  color: 0xde2a42,
  author: {
    name: "Se ha aislado una cuenta",
    iconURL:
      "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/322/stop-sign_1f6d1.png",
  },
  description: [
    `**Usuario**: ${userIdentifier(member.user)}`,
    reason ? `**Razón**: ${reason}` : `(No se ha proporcionado una razón)`,
    until ? `**Expira**: ${dateIdentifier(until)}` : false,
    source ? `**Aplicado por**: ${userIdentifier(source)}` : false,
  ]
    .filter(Boolean)
    .join("\n"),
});

export const createEndTimeoutEvent = (member: GuildMember, source?: User): MessageEmbedOptions => ({
  color: 0xde2a42,
  author: {
    name: "Se ha levantado un aislamiento",
    iconURL:
      "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/322/stop-sign_1f6d1.png",
  },
  description: [
    `**Usuario**: ${userIdentifier(member.user)}`,
    source ? `**Levantado por**: ${userIdentifier(source)}` : false,
  ]
    .filter(Boolean)
    .join("\n"),
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

function handleMemberUpdateNickname(prev: GuildMember, next: GuildMember): Promise<void> {
  /* The member has changed nicknames. */
  logger.debug(`[roster] has: changed nickname`);
  const event = createNicknameEvent(prev, next);
  return sendEvent(next.guild, event);
}

async function handleTimeout(prev: GuildMember, next: GuildMember): Promise<void> {
  const server = new Server(next.guild);

  /* NOTE: We do not receive events when a timeout decays naturally. */
  if (
    next.communicationDisabledUntilTimestamp &&
    next.communicationDisabledUntilTimestamp > Date.now()
  ) {
    /* We applied a timeout. */
    let reason = null,
      executor = null;
    try {
      const audit = await server.queryAuditLogEvent(
        "MEMBER_UPDATE",
        (event) =>
          event.target.id === next.user.id &&
          event.changes.some((change) => change.key === "communication_disabled_until")
      );
      if (audit) {
        reason = audit.reason;
        executor = audit.executor;
      }
    } catch (e) {
      logger.warn(`[roster] error on queryAuditLogEvent: ${e}`);
    }
    const event = createTimeoutEvent(next, reason, executor, next.communicationDisabledUntil);
    return sendEvent(next.guild, event);
  } else if (!next.communicationDisabledUntil) {
    /* We manually lifted a timeout. */
    let executor = null;
    try {
      const audit = await server.queryAuditLogEvent(
        "MEMBER_UPDATE",
        (event) =>
          event.target.id === next.user.id &&
          event.changes.some(
            (change) => change.key === "communication_disabled_until" && !change.new
          )
      );
      if (audit) {
        executor = audit.executor;
      }
    } catch (e) {
      logger.warn(`[roster] error on queryAuditLogEvent: ${e}`);
    }
    const event = createEndTimeoutEvent(next, executor);
    return sendEvent(next.guild, event);
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
    logger.debug(`[roster] evaluating member changes for ${newMember.id}`);

    const promises = [];
    if (oldMember.nickname != newMember.nickname) {
      promises.push(handleMemberUpdateNickname(oldMember, newMember));
    }

    if (
      oldMember.communicationDisabledUntilTimestamp != newMember.communicationDisabledUntilTimestamp
    ) {
      promises.push(handleTimeout(oldMember, newMember));
    }

    await Promise.all(promises);
  }

  async onGuildMemberLeave(member: PartialGuildMember): Promise<void> {
    // Check if the member left on their own, or if it was a kick.
    const server = new Server(member.guild);

    const kickEvent = await server.queryAuditLogEvent(
      "MEMBER_KICK",
      (e) => e.target.id === member.id
    );

    if (kickEvent && member.joinedAt && kickEvent.createdAt > member.joinedAt) {
      // It was a kick.
      const kickNotificationEvent: ModEvent = {
        createdAt: new Date(),
        expired: false,
        guild: member.guild.id,
        type: "KICK",
        mod: kickEvent.executor.id,
        reason: kickEvent.reason,
        target: kickEvent.target.id,
      };
      await notifyModlog(member.client as Makibot, kickNotificationEvent);
    } else {
      // It was a normal leave
      logger.debug(`[roster] announcing leave for ${member.user.tag}`);
      const event = createModlogNotification(createLeaveEvent(member));
      return sendEvent(member.guild, event);
    }
  }

  async onGuildMemberBan(ban: GuildBan): Promise<void> {
    const server = new Server(ban.guild);
    const event = await server.queryAuditLogEvent(
      "MEMBER_BAN_ADD",
      (e) => e.target.id == ban.user.id
    );
    const banEvent: ModEvent = {
      createdAt: new Date(),
      expired: false,
      guild: ban.guild.id,
      type: "BAN",
      mod: event.executor.id,
      reason: event.reason,
      target: event.target.id,
    };
    await notifyModlog(ban.client as Makibot, banEvent);
  }
}
