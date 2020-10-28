import { Message } from "discord.js";
import logger from "../lib/logger";
import Member from "../lib/member";
import { WastebinModlogEvent } from "../lib/modlog";
import Server from "../lib/server";
import Makibot from "../Makibot";
import Hook from "./hook";

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
  ],
};

function matches(message: string): string | undefined {
  return Object.keys(ruleset).find((rule) => {
    const regexps = ruleset[rule];
    return regexps.some((regexp) => regexp.test(message));
  });
}

function isAllowed(message: Message): boolean {
  if (message.author.bot) {
    return true;
  } else {
    const member = new Member(message.member);
    return member.trusted || member.moderator;
  }
}

/**
 * Attempts to preprocess a message in order to detect stuff such as separating the
 * URL with whitespaces or replacing some special tokens with words such as "dot",
 * "punto", "slash" or "barra".
 *
 * @param message the raw message received
 */
function normalizeMessageContent(message: Message): string {
  return message.content
    .replace(/\bbarra|slash\b/gi, "/")
    .replace(/\bpunto|dot\b/gi, "/")
    .replace(/\s+/g, "")
    .toLowerCase();
}

const NOTIFY = "(Se ha retenido el mensaje de %s: %s.)";

export default class AntispamService implements Hook {
  private client: Makibot;

  constructor(client: Makibot) {
    this.client = client;
    this.client.on("message", (message) => this.message(message));
    logger.debug("[hooks] hook started: antispam");
  }

  private async message(message: Message): Promise<void> {
    if (isAllowed(message)) {
      return; /* trusted member or bot */
    }
    const match = matches(normalizeMessageContent(message));
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
