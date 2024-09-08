import { Message, MessageEmbedOptions, PartialMessage, WebhookMessageOptions } from "discord.js";
import { Hook } from "../lib/hook";
import logger from "../lib/logger";
import { createModlogNotification } from "../lib/modlog";
import Server from "../lib/server";
import {
  channelIdentifier,
  dateIdentifier,
  messageIdentifier,
  userIdentifier,
} from "../lib/utils/format";

function createDeleteEmbed(message: Message | PartialMessage): MessageEmbedOptions {
  const base: MessageEmbedOptions = {
    author: {
      name: "Se ha eliminado un mensaje",
      iconURL:
        "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/248/wastebasket_1f5d1.png",
    },
    footer: {
      iconURL:
        "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/247/page-with-curl_1f4c3.png",
      text: "Mensaje de moderación automática",
    },
    color: 0x9b9b9b,
    description: [
      `**Usuario**: ${message.author ? userIdentifier(message.author) : "(desconocido)"}`,
      `**Mensaje**: ${messageIdentifier(message)}`,
      `**Canal**: ${channelIdentifier(message.channel)}`,
      `**Fecha**: ${dateIdentifier(message.createdAt)}`,
    ].join("\n"),
    fields: [],
  };
  if (message.attachments?.size > 0) {
    /* Log attachments. */
    const attachments = message.attachments.map((a) => `${a.name} (${a.contentType})`);
    base.description += `\n**Adjuntos**: (${attachments.length}) ${attachments.join(", ")}`;
  }
  if (message.cleanContent) {
    /* Log message content. */
    base.fields?.push({ name: "Contenido", value: message.cleanContent });
  }
  if (!message.cleanContent && (!message.attachments || message.attachments.size === 0)) {
    /* Sometimes a partial message with no information at all will come. */
    base.description += `\n\nMensaje parcial. La pasarela no ha entregado el contenido`;
  }
  return base;
}

/**
 * A hook that triggers whenever a message is deleted, in order to log the deletion
 * for moderation purposes. A copy of the message content, including permalinks
 * and identifiers, will be sent to the private modlog channel.
 *
 * Note: this event would be more useful if it could only be triggered as long as the
 * person who triggers the deletion is not the same as the person who originally
 * sent the message, but apparently it is not possible. Every message deletion will
 * be logged, as a consequence.
 */
export default class DeleteService implements Hook {
  name = "delete";

  async onMessageDestroy(message: Message | PartialMessage): Promise<void> {
    if (message.author?.bot) {
      /* This is a bot message. Ignore it. */
      logger.info("[delete] skipping a bot command");
      return;
    }

    if (!message.guild) {
      logger.info("[delete] skipping a message without a guild");
      return;
    }

    try {
      const embed = createModlogNotification(createDeleteEmbed(message));
      const server = new Server(message.guild);
      const payload: WebhookMessageOptions = { embeds: [embed] };
      if (embed.author) {
        payload.username = embed.author.name;
        payload.avatarURL = embed.author.iconURL;
      }
      await server.sendToModlog("delete", payload);
    } catch (e) {
      logger.error(`[delete] error during message logging`, e);
    }
  }
}
