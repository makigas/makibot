import Hook from "./hook";
import Makibot from "../Makibot";
import applyWarn from "../lib/warn";
import { Message, MessageReaction, User } from "discord.js";
import Server from "../lib/server";
import applyWastebin from "../lib/wastebin";
import logger from "../lib/logger";

function isMessageWarned(message: Message): boolean {
  const server = new Server(message.guild);
  const warnReaction = message.reactions.cache.find((reaction) => reaction.emoji.name === "⚠️");
  if (!warnReaction) {
    return false;
  }
  const mods = server.modsRole.members;
  return !!warnReaction.users.cache.find((user) => mods.some((mod) => mod.id === user.id));
}

export default class WarnService implements Hook {
  private client: Makibot;

  constructor(client: Makibot) {
    this.client = client;

    this.client.on("messageReactionAdd", (reaction, user) =>
      this.messageReactionAdd(reaction, user)
    );
    logger.debug("[hooks] hook started: warn");
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

    const authorIsMod = modRole.members.some((member) => member.id === author.id);
    const targetIsMod = modRole.members.some((member) => member.id === target.id);
    if (!authorIsMod || targetIsMod) {
      return;
    }

    if (reaction.emoji.name === "⚠️") {
      applyWarn(reaction.message.guild, {
        user: target,
        message: reaction.message,
      });
    } else if (reaction.emoji.name === "🗑️" && isMessageWarned(reaction.message)) {
      applyWastebin(reaction.message);
    }
  }
}
