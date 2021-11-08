import { PartialMessage } from "discord.js";
import { Hook } from "../lib/hook";
import logger from "../lib/logger";
import { WastebinModlogEvent } from "../lib/modlog";
import Server from "../lib/server";

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
    /* Log to the modlog the fact that a message was deleted. */
    try {
      const server = new Server(message.guild);
      await server.logModlogEvent(new WastebinModlogEvent(message));
    } catch (e) {
      logger.error(e);
    }
  }
}
