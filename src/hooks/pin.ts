import Discord, { Message, MessageReaction, PartialMessage, PartialUser, User } from "discord.js";

import { Hook } from "../lib/hook";
import Makibot from "../Makibot";
import Server from "../lib/server";
import logger from "../lib/logger";
import { quoteMessage } from "../lib/response";

async function resolveUser(user: User | PartialUser): Promise<User> {
  if (user.partial) {
    return user.fetch();
  } else {
    return user as User;
  }
}

async function resolveMessage(message: Message | PartialMessage): Promise<Message> {
  if (message.partial) {
    return message.fetch();
  } else {
    return message as Message;
  }
}

export default class PinService implements Hook {
  private client: Makibot;

  name = "pin";

  constructor(client: Makibot) {
    this.client = client;

    this.client.on("messageReactionAdd", async (reaction, user) => {
      /* Always fetch data, since old messages may yield partials. */
      reaction.message
        .fetch()
        .then((message) => this.handleReaction(reaction, message))
        .catch((e) => logger.error("[pin] cannot handle reaction", e));
    });

    /* TODO: Log the pin message so that we can delete it if needed. */

    this.client.on("messageReactionRemove", (reaction, user) =>
      resolveUser(user).then((user) => this.messageReactionRemove(reaction, user))
    );
    this.client.on("messageReactionRemoveAll", (message) =>
      resolveMessage(message).then((message) => this.messageReactionRemoveAll(message))
    );
  }

  private handleReaction(
    reaction: MessageReaction,
    message: Message
  ): Promise<Message | Message[]> {
    if (message.guild) {
      /* This message was sent to a guild, thus we might have a pin channel. */
      const server = new Server(message.guild);
      const trigger = server.settings.pinEmoji;
      const pinChannel = server.pinboardChannel;
      if (reaction.emoji.name === trigger && reaction.count === 1 && pinChannel) {
        const pin = quoteMessage(message);
        return pinChannel.send(pin);
      }
    }
  }

  private messageReactionRemove(reaction: Discord.MessageReaction, user: Discord.User) {
    console.log(
      `${user.tag} unreacted to ${reaction.message.id} with emoji ${reaction.emoji.name}`
    );
  }

  private messageReactionRemoveAll(message: Discord.Message) {
    console.log(`Reactions to message ${message.id} were deleted.`);
  }
}
