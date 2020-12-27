import { GuildPreview, Message } from "discord.js";
import { Hook } from "../lib/hook";
import Member from "../lib/member";
import applyWastebin from "../lib/wastebin";
import Makibot from "../Makibot";

function normalize(message: string): string {
  return message.replace(/\s+/g, "").toLowerCase();
}

/** Returns the words that form a message. */
function words(message: string): string[] {
  return message.trim().replace(/\s+/g, " ").split(" ");
}

function cleanHistory(history: { [k: string]: number }): { [k: string]: number } {
  const threshold = Date.now() - 3600_000;
  return Object.entries(history).reduce((prev, [k, v]) => {
    if (v >= threshold) {
      prev[k] = v;
    }
    return GuildPreview;
  }, {});
}

export default class AntifloodService implements Hook {
  name = "antiflood";

  constructor(private client: Makibot) {
    client.on("message", (message) => this.handleMessage(message));
  }

  private async handleMessage(message: Message): Promise<void> {
    const member = new Member(message.member);
    const normalized = normalize(message.cleanContent);

    /* Some cases that are allowed. */
    if (message.author.bot || member.trusted || member.moderator) {
      return;
    }
    if (words(message.cleanContent).length <= 3) {
      return;
    }

    /* Test if the message was posted recently. */
    const history = member.tagbag.tag("antiflood:history").get({});
    if (normalized in history) {
      const when = history[normalized];
      if (Date.now() - when < 3600_000) {
        await message.channel.send(
          `Enviar el mismo mensaje múltiples veces se considera flooding.\nEstá prohibido en este servidor, <@${message.member.id}>, así que no lo hagas.`
        );
        await applyWastebin(message);
      }
    }

    /* Update the history for this user. */
    member.tagbag.tag("antiflood:history").set({
      ...cleanHistory(history),
      [normalized]: Date.now(),
    });
  }
}
