import { Message } from "discord.js";
import getUrls from "get-urls";

import Member from "../lib/member";
import { WastebinModlogEvent } from "../lib/modlog";
import Server from "../lib/server";
import Makibot from "../Makibot";
import { Hook } from "../lib/hook";

const ruleset: { [reason: string]: RegExp[] } = {
  "El enlace contiene una invitación de Discord": [
    /discord.gg\/\w+/,
    /discordapp.com\/invite\/\w+/,
    /discord.com\/invite\/\w+/,
  ],
  "El enlace apunta a una página de perfil de red social": [
    /instagram.com\/[\w._]+\/?(\?.+)?$/, // intentionally allow instagram.com/p/ for the moment
    /facebook.com\/groups\/[\w._]+/, // intentionally also capture permalinks for posts in the group
    /facebook.com\/pages\/[\w._]+\/\d+/,
    /twitter.com\/\w+\/?(\?.+)?$/, // intentionally allow status because sharing tweets is common
    /twitch.tv\/\w+/, // Twitch pages
  ],
};

const disabledLinksReason = "el origen está retenido, un mod debería revisar los logs";

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
    return member.trusted || member.moderator;
  }
}

const NOTIFY = "(Se ha retenido el mensaje de %s: %s.)";

export default class AntispamService implements Hook {
  name = "antispam";

  private client: Makibot;

  constructor(client: Makibot) {
    this.client = client;
    this.client.on("message", (message) => this.message(message));
  }

  private async message(message: Message): Promise<void> {
    if (isAllowed(message)) {
      return; /* trusted member or bot */
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
        await message.delete();
        await channel.send(NOTIFY.replace("%s", `<@${message.member.id}>`).replace("%s", match));
      }
    }
  }
}
