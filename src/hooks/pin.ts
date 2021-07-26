import type { Message, MessageReaction, PartialMessage, Snowflake, TextChannel } from "discord.js";
import { Hook } from "../lib/hook";
import logger from "../lib/logger";
import { quoteMessage } from "../lib/response";
import Server from "../lib/server";
import type Tag from "../lib/tag";
import type Makibot from "../Makibot";

/* Get the tag that would persist the pin for this message. */
function pinTag(message: Message): Tag | null {
  if (message.guild) {
    const server = new Server(message.guild);
    return server.tagbag.tag(`pin:${message.id}`);
  }
  return null;
}

/* Get the pin channel behind the given guild message. */
function getPinChannel(message: Message): TextChannel | null {
  if (message.guild) {
    const server = new Server(message.guild);
    return server.pinboardChannel;
  } else {
    return null;
  }
}

/* For a message to be pinneable, it must be part of a guild. */
function isPinneable(message: Message): boolean {
  if (message.guild) {
    const server = new Server(message.guild);
    return !!server.pinboardChannel && !!server.settings.pinEmoji;
  } else {
    return false;
  }
}

/* For a message to be pineable, the reaction must be the configured. */
function delegatesToPin(reaction: MessageReaction): boolean {
  if (isPinneable(reaction.message)) {
    const server = new Server(reaction.message.guild);
    return reaction.emoji.name === server.settings.pinEmoji;
  } else {
    return false;
  }
}

export default class PinService implements Hook {
  private client: Makibot;

  name = "pin";

  constructor(client: Makibot) {
    this.client = client;

    this.addReaction = this.addReaction.bind(this);
    this.removeReaction = this.removeReaction.bind(this);
    this.removeAllReactions = this.removeAllReactions.bind(this);

    this.client.on("messageReactionAdd", this.addReaction);
    this.client.on("messageReactionRemove", this.removeReaction);
    this.client.on("messageReactionRemoveAll", this.removeAllReactions);
  }

  private async addReaction(reaction: MessageReaction): Promise<void> {
    try {
      await reaction.fetch();

      /* Only pin messages in a properly configured guild will be delegated. */
      if (delegatesToPin(reaction)) {
        const tag = pinTag(reaction.message);

        /* Past-proof: legacy pins will not have a tag but will already exist. */
        if (!tag.get(null) && reaction.count === 1) {
          const channel = getPinChannel(reaction.message);
          const pins = await channel.send(quoteMessage(reaction.message)).then((pins) => {
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

  private async removeReaction(reaction: MessageReaction): Promise<void> {
    try {
      await reaction.fetch();
      if (delegatesToPin(reaction) && reaction.count === 0) {
        await this.deletePinMessage(reaction.message);
      }
    } catch (e) {
      logger.error("[pin] error during removeReaction callback", e);
    }
  }

  private async removeAllReactions(message: Message | PartialMessage): Promise<void> {
    try {
      const richMessage = await message.fetch();
      if (isPinneable(richMessage)) {
        await this.deletePinMessage(richMessage);
      }
    } catch (e) {
      logger.error("[pin] error during removeReactionAll callback", e);
    }
  }

  private async deletePinMessage(message: Message) {
    const tag = pinTag(message);
    const channel = getPinChannel(message);
    await Promise.all(
      tag.get([] as Snowflake[]).map(async (pinId) => {
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
