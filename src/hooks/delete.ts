import { MessageEmbedOptions, PartialMessage } from "discord.js";
import { Hook } from "../lib/hook";
import logger from "../lib/logger";
import { createModlogNotification } from "../lib/modlog/notifications";
import Server from "../lib/server";
import {
  channelIdentifier,
  dateIdentifier,
  messageIdentifier,
  userIdentifier,
} from "../lib/utils/format";

const createDeleteEvent = (message: PartialMessage): MessageEmbedOptions => ({
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
    `**Usuario**: ${userIdentifier(message.author)}`,
    `**Mensaje**: ${messageIdentifier(message)}`,
    `**Canal**: ${channelIdentifier(message.channel)}`,
    `**Fecha**: ${dateIdentifier(message.createdAt)}`,
  ].join("\n"),
  fields: [
    {
      name: "Contenido",
      value: message.cleanContent,
    },
  ],
});

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

  async onMessageDestroy(message: PartialMessage): Promise<void> {
    if (message.cleanContent && message.cleanContent.startsWith(";;")) {
      logger.info("[delete] skipping a fred command");
      return;
    }
    /* Log to the modlog the fact that a message was deleted. */
    try {
      const embed = createModlogNotification(createDeleteEvent(message));
      const server = new Server(message.guild);
      await server.sendToModlog("delete", {
        username: embed.author.name,
        avatarURL: embed.author.iconURL,
        embeds: [embed],
      });
    } catch (e) {
      logger.error(`[delete] error during message logging`, e);
    }
  }
}
