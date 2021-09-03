import { Message } from "discord.js";
import getUrls from "get-urls";

import Member from "../lib/member";
import { WastebinModlogEvent } from "../lib/modlog";
import Server from "../lib/server";
import { Hook } from "../lib/hook";
import { createToast } from "../lib/response";
import applyWarn from "../lib/warn";

const ruleset: { [reason: string]: RegExp[] } = {
  "El enlace contiene una invitación de Discord": [
    /discord.gg\/\w+/,
    /discordapp.com\/invite\/\w+/,
    /discord.com\/invite\/\w+/,
    /dsc.gg\/w+/,
  ],
  "El enlace apunta a una página de perfil de red social": [
    /instagram.com\/[\w._]+\/?(\?.+)?$/, // intentionally allow instagram.com/p/ for the moment
    /facebook.com\/groups\/[\w._]+/, // intentionally also capture permalinks for posts in the group
    /facebook.com\/pages\/[\w._]+\/\d+/,
    /twitter.com\/\w+\/?(\?.+)?$/, // intentionally allow status because sharing tweets is common
    /twitch.tv\/\w+/, // Twitch pages,
    /steamcommunity.com\/id\/\w+/, // Steam profile pages by vanity URL.
    /steamcommunity.com\/profiles\/\w+/, // Steam profile pages by ID.
  ],
  "El enlace apunta a una tienda de aplicaciones": [/play.google.com\/store\/apps\/details/],
  "El enlace apunta a un Google Doc": [
    /docs.google.com\/document\/d\//, // Google Docs
    /docs.google.com\/spreadsheets\/d\//, // Google Docs
    /docs.google.com\/presentations\/d\//, // Google Docs
    /docs.google.com\/forms\/d\//, // Google Forms
  ],
};

const disabledLinksReason =
  "A este perfil se le ha retirado el permiso para enviar mensajes con enlaces en este servidor";

function matchesUrlInRuleset(message: string): string | undefined {
  return Object.keys(ruleset).find((rule) => {
    const regexps = ruleset[rule];
    return regexps.some((regexp) => regexp.test(message));
  });
}

function messageContainsURL(message: string): boolean {
  return getUrls(message).size > 0;
}

/**
 * Attempts to preprocess a message in order to detect funky changes designed
 * to bypass antispam systems. Note that you cannot be too strict. For instance,
 * previously this function would strip all spaces, but this would cause
 * sentences such as "Hola. Estoy aquí" to be caught, since they yield
 * "hola.estoyaqui" and "hola.es" gets detected as a link.
 *
 * @param message the raw message received
 */
function normalizeMessageContent(message: Message): string {
  return message.content.toLowerCase();
}

function testModeration(message: Message): string | undefined {
  const member = new Member(message.member);
  const text = normalizeMessageContent(message);

  if (!member.canPostLinks && messageContainsURL(text)) {
    /* The member cannot post links. */
    return disabledLinksReason;
  } else {
    /* The message may or may not contain a link to an invalid site. */
    return matchesUrlInRuleset(text);
  }
}

function isAllowed(message: Message): boolean {
  if (message.author.bot) {
    return true;
  } else {
    const member = new Member(message.member);
    return member.crew || member.moderator;
  }
}

export default class AntispamService implements Hook {
  name = "antispam";

  async onMessageCreate(message: Message): Promise<void> {
    if (isAllowed(message)) {
      return; /* mod or bot */
    }

    const match = testModeration(message);
    if (match) {
      const server = new Server(message.guild);

      /* Send message to the modlog. */
      server
        .logModlogEvent(new WastebinModlogEvent(message))
        .catch((e) => console.error(`Error during wastebin handler: ${e}`));

      const channel = message.channel;
      if (server.captchasChannel?.id === channel.id) {
        /* On the captchas channel, the protocol is to automatically ban the member. */
        await message.delete();
        await message.member.ban({
          reason: "Spam",
        });
      } else {
        const member = new Member(message.member);
        await message.delete();
        if (member.trippedAntispam) {
          /* Okay, I warned you. */
          await applyWarn(message.guild, {
            duration: 86400 * 1000 * 7,
            user: message.author,
            reason: "Una cadena de texto prohibida por el sistema antispam ha sido interceptada",
            message,
          });
          await member.setMuted(true);

          /* Delete the original message with a tombstone. */
          const toast = createToast({
            title: "Mensaje interceptado como spam",
            description:
              "El sistema antispam ha eliminado un mensaje que ha identificado como positivo.",
            severity: "error",
            target: message.author,
          });
          await message.channel.send({ embeds: [toast] });
        } else {
          /* I'll remember this. */
          await member.tripAntispam();

          const toast = createToast({
            title: `@${message.member.user.username}, tu mensaje ha sido retenido por tener un enlace inapropiado`,
            description: [
              `Tu mensaje contenía un enlace que ha hecho saltar el filtro antispam.`,
              `El filtro antispam ha dicho: ${match}.`,
              `\n\n`,
              `Tu mensaje ha sido reenviado a moderación para que lo revise y decida`,
              `si ha sido un error del filtro o si debe dejar caer el martillo del ban`,
              `sobre ti. Si no has incumplido las normas, no debes tener miedo.`,
            ].join(" "),
            severity: "error",
            target: message.member.user,
          });
          await channel.send({ embeds: [toast] });
        }
      }
    }
  }
}
