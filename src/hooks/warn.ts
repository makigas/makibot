import Hook from "./hook";
import Makibot from "../Makibot";
import applyWarn from "../lib/warn";
import { GuildMember, Message, MessageReaction, User } from "discord.js";
import Server from "../lib/server";

function isMod(user: GuildMember): boolean {
  const server = new Server(user.guild);
  const modRole = server.modsRole;
  return modRole.members.exists("id", user.id);
}

function isMessageWarned(message: Message): boolean {
  const warnReaction = message.reactions.find((reaction) => reaction.emoji.name === "⚠️");
  if (!warnReaction) {
    return false;
  }
  return !!warnReaction.users.find((user) => isMod(message.guild.member(user)));
}

export default class WarnService implements Hook {
  private client: Makibot;

  constructor(client: Makibot) {
    this.client = client;

    this.client.on("messageReactionAdd", (reaction, user) =>
      this.messageReactionAdd(reaction, user)
    );
  }

  private messageReactionAdd(reaction: MessageReaction, user: User) {
    // I can only react to messages sent to guild text channels.
    if (reaction.message.channel.type !== "text" || !reaction.message.guild) {
      return;
    }

    const guildUser = reaction.message.guild.member(user);
    if (!isMod(guildUser)) {
      console.log("No es un mod");
      return;
    }

    if (reaction.emoji.name === "⚠️") {
      applyWarn(reaction.message.guild, {
        user: reaction.message.author,
        message: reaction.message,
      });
    } else if (reaction.emoji.name === "🗑️" && isMessageWarned(reaction.message)) {
      reaction.message.delete();
    }
  }
}
