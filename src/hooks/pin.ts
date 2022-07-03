import { PartialMessage, WebhookClient } from "discord.js";
import { Hook } from "../lib/hook";
import logger from "../lib/logger";
import Server from "../lib/server";
export default class PinService implements Hook {
  name = "pin";

  async onMessageDestroy?(message: PartialMessage): Promise<void> {
    // Check if the message was sent to the modlog.
    if (message.guild) {
      const server = new Server(message.guild);
      const pin = server.tagbag.tag(`pin:${message.id}`);
      const pinnedMessageId = await pin.get(null);

      const webhook = await server.getPinboardWebhook();
      if (!webhook) {
        logger.warn("[pin] webhook not configured for guild ", message.guild.id);
        return;
      }

      if (pinnedMessageId) {
        logger.info("[pin] message ", message.id, " was sent to the pinboard. Trying to delete...");
        const client = new WebhookClient({ url: webhook });
        client.deleteMessage(pinnedMessageId);
        await pin.delete();
      }
    }
  }
}
