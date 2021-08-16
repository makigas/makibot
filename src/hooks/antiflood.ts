import { GuildPreview, Message, PartialMessage } from "discord.js";
import { Hook } from "../lib/hook";
import Member from "../lib/member";
import { createToast } from "../lib/response";
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

async function prefetchMessage(message: Message | PartialMessage): Promise<Message> {
  if (message.partial) {
    return message.fetch();
  } else {
    return message as Message;
  }
}

export default class AntifloodService implements Hook {
  name = "antiflood";

  constructor(private client: Makibot) {
    client.on("message", (message) => this.handleMessage(message));
    client.on("messageDelete", (message) =>
      prefetchMessage(message).then((message) => this.handleDelete(message))
    );
    client.on("messageDeleteBulk", (messages) =>
      messages.forEach((message) =>
        prefetchMessage(message).then((message) => this.handleDelete(message))
      )
    );
  }

  private async handleDelete(message: Message): Promise<void> {
    const member = new Member(message.member);
    const normalized = normalize(message.cleanContent);

    /* Forget about the message. */
    const tag = member.tagbag.tag("antiflood:history");
    const history = tag.get({});
    delete history[normalized];
    await tag.set(cleanHistory(history));
  }

  private async handleMessage(message: Message): Promise<void> {
    if (!message.member || !message.member.guild) {
      /* Webhooks will trigger this. */
      return;
    }
    const member = new Member(message.member);
    const normalized = normalize(message.cleanContent);

    /* Some cases that are allowed. */
    if (message.author.bot || !member.verified || member.moderator) {
      return;
    }
    if (words(message.cleanContent).length <= 3) {
      return;
    }

    /* Test if the message was posted recently. */
    const tag = member.tagbag.tag("antiflood:history");
    const history = tag.get({});
    if (normalized in history) {
      const when = history[normalized];
      if (Date.now() - when < 3600_000) {
        const toast = createToast({
          title: `@${message.member.user.username}, no hagas flooding`,
          severity: "warning",
          target: message.member.user,
          description: [
            "Ponte de acuerdo y elige un canal en el que mandar tu mensaje.",
            "No mandes el mismo mensaje a múltiples canales porque puede ser",
            "confuso para las personas que te pueden estar intentando echar",
            "una mano, ¿no crees?",
            "\n\n",
            "Tendrás que borrar el mensaje del otro canal si quieres mandarlo",
            "aquí, o esperar una hora para que el mensaje se enfríe.",
          ].join(" "),
        });
        await message.channel.send({ embeds: [toast] });
        await applyWastebin(message);
      }
    }

    /* Update the history for this user. */
    tag.set({
      ...cleanHistory(history),
      [normalized]: Date.now(),
    });
  }
}
