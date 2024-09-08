import {
  Guild,
  GuildBan,
  GuildMember,
  MessageEmbedOptions,
  PartialGuildMember,
  User,
  WebhookMessageOptions,
} from "discord.js";
import { Hook } from "../lib/hook";
import logger from "../lib/logger";
import { createModlogNotification, notifyModlog, ModEvent } from "../lib/modlog";
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

export const createLeaveEvent = (
  member: GuildMember | PartialGuildMember,
): MessageEmbedOptions => ({
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
  oldMember: PartialGuildMember | GuildMember,
  newMember: PartialGuildMember | GuildMember,
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
    const payload: WebhookMessageOptions = { embeds: [embed] };
    if (embed.author) {
      payload.username = embed.author.name;
      payload.avatarURL = embed.author.iconURL;
    }
    await server.sendToModlog("default", payload);
  } catch (e) {
    logger.error(`[roster] error during event handling`, e);
  }
}

function handleMemberUpdateNickname(
  prev: PartialGuildMember | GuildMember,
  next: PartialGuildMember | GuildMember,
): Promise<void> {
  /* The member has changed nicknames. */
  logger.debug(`[roster] has: changed nickname`);
  const event = createNicknameEvent(prev, next);
  return sendEvent(next.guild, event);
}

async function findTimeout(
  server: Server,
  member: PartialGuildMember | GuildMember,
): Promise<ModEvent | null> {
  const timeoutEvent = await server.queryAuditLogEvent("MEMBER_UPDATE", (event) =>
    event.target && event.changes
      ? event.target.id === member.user.id &&
        event.changes.some((change) => change.key === "communication_disabled_until")
      : false,
  );
  if (!timeoutEvent) {
    return null;
  }
  const modEvent: ModEvent = {
    createdAt: timeoutEvent.createdAt,
    expiresAt: member.communicationDisabledUntil!,
    expired: false,
    guild: server.id,
    type: "TIMEOUT",
    target: member.id,
    mod: timeoutEvent.executor!.id,
  };
  if (timeoutEvent.reason) modEvent.reason = timeoutEvent.reason;
  return modEvent;
}

async function findLiftTimeout(
  server: Server,
  member: PartialGuildMember | GuildMember,
): Promise<ModEvent | null> {
  const untimeoutEvent = await server.queryAuditLogEvent("MEMBER_UPDATE", (event) =>
    event.target && event.changes
      ? event.target.id === member.user.id &&
        event.changes?.some(
          (change) => change.key === "communication_disabled_until" && !change.new,
        )
      : false,
  );
  if (!untimeoutEvent) {
    return null;
  }
  return {
    createdAt: new Date(),
    expired: true,
    guild: member.guild.id,
    type: "UNTIMEOUT",
    mod: untimeoutEvent.executor!.id,
    target: member.id,
  };
}

async function findKick(
  server: Server,
  member: GuildMember | PartialGuildMember,
): Promise<ModEvent | null> {
  const kickEvent = await server.queryAuditLogEvent(
    "MEMBER_KICK",
    (e) => e.target != null && e.target.id === member.id,
  );
  if (!kickEvent) {
    return null;
  }
  const modEvent: ModEvent = {
    createdAt: kickEvent.createdAt,
    expired: false,
    guild: member.guild.id,
    type: "KICK",
    mod: kickEvent.executor!.id,
    target: member.id,
  };
  if (kickEvent.reason) {
    modEvent.reason = kickEvent.reason;
  }
  return modEvent;
}

async function findBan(server: Server, user: User): Promise<ModEvent | null> {
  const banEvent = await server.queryAuditLogEvent(
    "MEMBER_BAN_ADD",
    (e) => e.target != null && e.target.id === user.id,
  );
  if (!banEvent) {
    return null;
  }
  const modEvent: ModEvent = {
    createdAt: banEvent.createdAt,
    expired: false,
    guild: server.id,
    type: "BAN",
    mod: banEvent.executor!.id,
    target: user.id,
  };
  if (banEvent.reason) {
    modEvent.reason = banEvent.reason;
  }
  return modEvent;
}

async function handleTimeout(
  prev: PartialGuildMember | GuildMember,
  next: PartialGuildMember | GuildMember,
): Promise<void> {
  const server = new Server(next.guild);
  const repo = (next.client as Makibot).modrepo;

  if (
    next.communicationDisabledUntilTimestamp &&
    next.communicationDisabledUntilTimestamp > Date.now()
  ) {
    /* A timeout was applied or updated. */
    const timeoutEvent = await findTimeout(server, next);
    if (timeoutEvent) {
      const persisted = await repo.persistEvent(timeoutEvent);
      await notifyModlog(next.client as Makibot, persisted);
    }
  } else if (!next.communicationDisabledUntil) {
    /* A timeout has lifted because someone lifted it. */
    const untimeoutEvent = await findLiftTimeout(server, next);
    if (untimeoutEvent) {
      const persisted = await repo.persistEvent(untimeoutEvent);
      await repo.evictAny(next.id, "TIMEOUT");
      await notifyModlog(next.client as Makibot, persisted);
    }
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

  async onGuildMemberUpdate(
    oldMember: PartialGuildMember | GuildMember,
    newMember: PartialGuildMember | GuildMember,
  ): Promise<void> {
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

  async onGuildMemberLeave(member: GuildMember | PartialGuildMember): Promise<void> {
    // Check if the member left on their own, or if it was a kick.
    const server = new Server(member.guild);

    const kickEvent = await findKick(server, member);
    if (kickEvent && member.joinedAt && kickEvent.createdAt > member.joinedAt) {
      /* We have evidence the user has just been kicked. */
      const repo = (member.client as Makibot).modrepo;
      const persisted = await repo.persistEvent(kickEvent);
      await notifyModlog(member.client as Makibot, persisted);
    } else {
      /* Normal leave. */
      logger.debug(`[roster] announcing leave for ${member.user.tag}`);
      const event = createModlogNotification(createLeaveEvent(member));
      return sendEvent(member.guild, event);
    }
  }

  async onGuildMemberBan(ban: GuildBan): Promise<void> {
    const server = new Server(ban.guild);
    const repo = (ban.client as Makibot).modrepo;
    const banEvent = await findBan(server, ban.user);
    if (banEvent) {
      const persisted = await repo.persistEvent(banEvent);
      await notifyModlog(ban.client as Makibot, persisted);
    }
  }
}
