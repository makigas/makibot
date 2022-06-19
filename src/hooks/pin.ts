import type {
  GuildChannel,
  Message,
  MessageReaction,
  PartialMessage,
  Snowflake,
  TextChannel,
} from "discord.js";
import { Hook } from "../lib/hook";
import logger from "../lib/logger";
import { quoteMessage } from "../lib/response";
import Server from "../lib/server";
import type Tag from "../lib/tag";

/* Get the tag that would persist the pin for this message. */
function pinTag(message: Message | PartialMessage): Tag | null {
  if (message.guild) {
    const server = new Server(message.guild);
    return server.tagbag.tag(`pin:${message.id}`);
  }
  return null;
}

/* Get the pin channel behind the given guild message. */
function getPinChannel(message: Message | PartialMessage): Promise<TextChannel> | null {
  if (message.guild) {
    const server = new Server(message.guild);
    return server.pinboardChannel();
  } else {
    return null;
  }
}

/* For a message to be pinneable, it must be part of a guild. */
function isPinneable(message: Message | PartialMessage): boolean {
  if (message.guild) {
    const server = new Server(message.guild);
    return !!server.pinboardChannel && !!server.settings.getPinEmoji;
  } else {
    return false;
  }
}

/* For a message to be pineable, the reaction must be the configured. */
async function delegatesToPin(reaction: MessageReaction): Promise<boolean> {
  if (isPinneable(reaction.message)) {
    const server = new Server(reaction.message.guild);
    return reaction.emoji.name === (await server.settings.getPinEmoji());
  } else {
    return false;
  }
}

export default class PinService implements Hook {
  name = "pin";

  async onMessageReactionAdd(reaction: MessageReaction): Promise<void> {
    try {
      await reaction.fetch();

      /* I mean, I've just fetched this. */
      const message = reaction.message as Message;

      /* Check permissions for this channel. */
      if (message.channel.type === "GUILD_TEXT") {
        const guildChannel = message.channel as GuildChannel;
        const permissions = await guildChannel.permissionsFor(guildChannel.guild.roles.everyone);
        if (!permissions.has("VIEW_CHANNEL")) {
          logger.info(
            `[pin] skipping pin of ${message.id} because ${message.channel.name} is not public`
          );
          return;
        }
      }

      /* Only pin messages in a properly configured guild will be delegated. */
      if (await delegatesToPin(reaction)) {
        const tag = pinTag(message);

        /* Past-proof: legacy pins will not have a tag but will already exist. */
        if (!(await tag.get(null)) && reaction.count === 1) {
          const channel = await getPinChannel(message);
          const pins = await channel.send(quoteMessage(message)).then((pins) => {
            /* Should not happen, but just in case: coerce to array. */
            return Array.isArray(pins) ? pins : [pins];
          });
          /* Build relation between original message and pins. */
          await tag.set(pins.map((message) => message.id));
        }
      }
    } catch (e) {
      logger.error("[pin] error during addReaction callback", e);
    }
  }

  async onMessageReactionDestroy(reaction: MessageReaction): Promise<void> {
    try {
      await reaction.fetch();
      if ((await delegatesToPin(reaction)) && reaction.count === 0) {
        await this.deletePinMessage(reaction.message);
      }
    } catch (e) {
      logger.error("[pin] error during removeReaction callback", e);
    }
  }

  async onMessageReactionBulkDestroy(message: Message): Promise<void> {
    try {
      const richMessage = await message.fetch();
      if (isPinneable(richMessage)) {
        await this.deletePinMessage(richMessage);
      }
    } catch (e) {
      logger.error("[pin] error during removeReactionAll callback", e);
    }
  }

  private async deletePinMessage(message: Message | PartialMessage) {
    const tag = pinTag(message);
    const channel = await getPinChannel(message);
    const pinIds: Snowflake[] = await tag.get([]);
    await Promise.all(
      pinIds.map(async (pinId) => {
        try {
          const message = await channel.messages.fetch(pinId);
          return message.delete();
        } catch (e) {
          logger.warn(`[pin] cannot delete message ${pinId} // ${message.id}`, e);
        }
      })
    );
    await tag.delete();
  }
}
