import Hook from "./hook";
import Makibot from "../Makibot";
import applyWarn from "../lib/warn";
import { Message, MessageReaction, User } from "discord.js";
import Server from "../lib/server";

function isMessageWarned(message: Message): boolean {
  const server = new Server(message.guild);
  const warnReaction = message.reactions.find((reaction) => reaction.emoji.name === "⚠️");
  if (!warnReaction) {
    return false;
  }
  return !!warnReaction.users.find((user) => server.modsRole.members.exists("id", user.id));
}

export default class WarnService implements Hook {
  private client: Makibot;

  constructor(client: Makibot) {
    this.client = client;

    this.client.on("messageReactionAdd", (reaction, user) =>
      this.messageReactionAdd(reaction, user)
    );
  }

  private messageReactionAdd(reaction: MessageReaction, user: User): void {
    // I can only react to messages sent to guild text channels.
    if (reaction.message.channel.type !== "text" || !reaction.message.guild) {
      return;
    }

    const author = reaction.message.guild.member(user);
    const target = reaction.message.author;
    const server = new Server(reaction.message.guild);

    const modRole = server.modsRole;
    if (!modRole.members.exists("id", author.id) || modRole.members.exists("id", target.id)) {
      return;
    }

    if (reaction.emoji.name === "⚠️") {
      applyWarn(reaction.message.guild, {
        user: target,
        message: reaction.message,
      });
    } else if (reaction.emoji.name === "🗑️" && isMessageWarned(reaction.message)) {
      reaction.message.delete();
    }
  }
}
