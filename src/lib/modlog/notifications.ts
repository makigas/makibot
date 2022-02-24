import { time, userMention } from "@discordjs/builders";
import { Guild, MessageEmbedOptions } from "discord.js";
import type Makibot from "../../Makibot";
import Server from "../server";
import { dateIdentifier, userIdentifier } from "../utils/format";
import type { ModEvent } from "./types";

const PUBLIC_TEMPLATES = {
  DELETE: ":wastebasket: Se ha eliminado un mensaje de $TARGET$. Razón: `$REASON$`",
  WARN: ":warning: Se llamó la atención a $TARGET$. Razón: `$REASON$`. Expira: $EXP$",
  UNWARN: ":ballot_box_with_check: Ha expirado la llamada de atención a $TARGET$",
  MUTE: ":mute: Se ha silenciado a $TARGET$. Razón: `$REASON$`. Expira: $EXP$",
  UNMUTE: ":speaker: Ha expirado el silencio a $TARGET$",
  KICK: ":athletic_shoe: Se echó a $TARGET$ del servidor, Razón: `$REASON$`.",
  BAN: ":hammer: Se baneó a $TARGET$ del servidor. Razón: `$REASON$`.",
};

const PRIVATE_TEMPLATES = {
  WARN: {
    color: 0xffcd4c,
    name: "Se ha aplicado un warn",
    icon: "https://makigas.github.io/makibot/images/warning.png",
    fields: (event: ModEvent): string =>
      [
        `**Objetivo**: ${userIdentifier(event.target)}`,
        `**Mod**: ${userIdentifier(event.mod)}`,
        `**Razón**: ${event.reason}`,
        `**Expiración**: ${event.expiresAt ? dateIdentifier(event.expiresAt) : "manualmente"}`,
      ].join("\n"),
  },
  UNWARN: {
    color: 0x15669b,
    name: "Ha expirado un warn",
    icon: "https://makigas.github.io/makibot/images/checkbox.png",
    fields: (event: ModEvent): string =>
      [
        `**Objetivo**: ${userIdentifier(event.target)}`,
        `**Mod**: ${userIdentifier(event.mod)}`,
      ].join("\n"),
  },
  MUTE: {
    color: 0x899aa8,
    name: "Se ha aplicado un mute",
    icon: "https://makigas.github.io/makibot/images/mute.png",
    fields: (event: ModEvent): string =>
      [
        `**Objetivo**: ${userIdentifier(event.target)}`,
        `**Mod**: ${userIdentifier(event.mod)}`,
        `**Razón**: ${event.reason}`,
        `**Expiración**: ${event.expiresAt ? dateIdentifier(event.expiresAt) : "manualmente"}`,
      ].join("\n"),
  },
  UNMUTE: {
    color: 0x899aa8,
    name: "Ha expirado un mute",
    icon: "https://makigas.github.io/makibot/images/speaker.png",
    fields: (event: ModEvent): string =>
      [
        `**Objetivo**: ${userIdentifier(event.target)}`,
        `**Mod**: ${userIdentifier(event.mod)}`,
      ].join("\n"),
  },
  KICK: {
    color: 0xdf2540,
    name: "Se ha echado del servidor",
    icon: "https://makigas.github.io/makibot/images/shoe.png",
    fields: (event: ModEvent): string =>
      [
        `**Objetivo**: ${userIdentifier(event.target)}`,
        `**Mod**: ${userIdentifier(event.mod)}`,
        `**Razón**: ${event.reason}`,
      ].join("\n"),
  },
  BAN: {
    color: 0x667680,
    name: "Se ha aplicado ban",
    icon: "https://makigas.github.io/makibot/images/hammer.png",
    fields: (event: ModEvent): string =>
      [
        `**Objetivo**: ${userIdentifier(event.target)}`,
        `**Mod**: ${userIdentifier(event.mod)}`,
        `**Razón**: ${event.reason}`,
      ].join("\n"),
  },
};

export function createModlogNotification(payload: MessageEmbedOptions): MessageEmbedOptions {
  return {
    ...payload,
    footer: {
      iconURL:
        "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/247/page-with-curl_1f4c3.png",
      text: "Mensaje de moderación automática",
    },
  };
}

/**
 * Converts an event into the formatted string that should be sent to the modlog.
 * @param event the event to transform into a string to be used in modlogs.
 * @returns the string to be sent to the proper modlog channel
 */
function composePublicModlogMessage(event: ModEvent): string {
  const target = userMention(event.target);
  const reason = event.reason || "(no se especificó razón)";
  const expiration = event.expiresAt ? time(event.expiresAt, "R") : "manualmente";
  const eventId = event.id ? ` - [#${event.id}]` : "";
  return (
    PUBLIC_TEMPLATES[event.type]
      .replace("$TARGET$", target)
      .replace("$REASON$", reason)
      .replace("$EXP$", expiration) + eventId
  );
}

function composePrivateModlogMessage(event: ModEvent): MessageEmbedOptions {
  const template = PRIVATE_TEMPLATES[event.type];
  if (template) {
    return createModlogNotification({
      color: template.color,
      author: {
        name: template.name,
        iconURL: template.icon,
      },
      description: template.fields(event),
    });
  }
  return null;
}

async function sendToPublicModlog(guild: Guild, event: ModEvent): Promise<void> {
  const message = composePublicModlogMessage(event);
  const server = new Server(guild);
  await server.sendToModlog("public", {
    content: message,
  });
}

async function sendToPrivateModlog(guild: Guild, event: ModEvent): Promise<void> {
  const message = composePrivateModlogMessage(event);
  const server = new Server(guild);
  await server.sendToModlog("default", {
    username: message.author.name,
    avatarURL: message.author.iconURL,
    embeds: [message],
  });
}

/**
 * If the guild in which the event is defined has a public modlog, this
 * function will send
 * @param client the client (to fetch the guilds and parameters)
 * @param event the event to submit to the public modlog
 */
export async function notifyModlog(client: Makibot, event: ModEvent): Promise<void> {
  const guild = await client.guilds.fetch(event.guild);
  await Promise.all([sendToPublicModlog(guild, event), sendToPrivateModlog(guild, event)]);
}
