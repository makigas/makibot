import { Hook } from "../lib/hook";
import Makibot from "../Makibot";
import applyWarn, { removeWarn } from "../lib/warn";
import { Message, MessageReaction, User } from "discord.js";
import Server from "../lib/server";
import applyWastebin from "../lib/wastebin";

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
  name = "warn";

  private client: Makibot;

  constructor(client: Makibot) {
    this.client = client;

    this.client.on("messageReactionAdd", (reaction, user) => {
      if (user.partial) {
        user.fetch().then((realUser) => this.messageReactionAdd(reaction, realUser));
      } else {
        this.messageReactionAdd(reaction, user as User);
      }
    });

    this.restoreOldTimeouts();
  }

  private restoreOldTimeouts() {
    this.client.guilds.cache.forEach(async (guild) => {
      const server = new Server(guild);
      const warnList = server.tagbag.tag("warns");
      const activeWarns = warnList.get({});
      for (let activeWarn in activeWarns) {
        let member = await server.member(activeWarn);
        if (member) {
          let expDate = activeWarns[activeWarn];
          let remain = expDate - Date.now();
          setTimeout(async () => removeWarn(server, member), remain);
        }
      }
    });
  }

  private async messageReactionAdd(reaction: MessageReaction, user: User): Promise<void> {
    // I can only react to messages sent to guild text channels.
    if (reaction.message.channel.type !== "text" || !reaction.message.guild) {
      return;
    }

    const server = new Server(reaction.message.guild);
    const author = await server.member(user);
    const target = await server.member(reaction.message.author);
    if (!author || !author.moderator || target.moderator) {
      return;
    }

    if (reaction.emoji.name === "⚠️") {
      applyWarn(reaction.message.guild, {
        user: reaction.message.author,
        message: reaction.message,
      });
    } else if (reaction.emoji.name === "🗑️" && isMessageWarned(reaction.message)) {
      await applyWastebin(reaction.message);
    }
  }
}
