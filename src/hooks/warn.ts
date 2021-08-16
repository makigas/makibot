import { Hook } from "../lib/hook";
import Makibot from "../Makibot";
import applyWarn, { removeWarn } from "../lib/warn";
import { Message, MessageReaction, Snowflake, User } from "discord.js";
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

    this.client.on("messageReactionAdd", async (reaction, user) => {
      const fetchedReaction = await reaction.fetch();
      const fetchedUser = await user.fetch();
      this.messageReactionAdd(fetchedReaction, fetchedUser);
    });

    this.restoreOldTimeouts();
  }

  private restoreOldTimeouts(): void {
    this.client.guilds.cache.forEach(async (guild) => {
      const server = new Server(guild);
      const warnList = server.tagbag.tag("warns");
      const activeWarns: { [id: string]: number } = warnList.get({});
      for (const activeWarn in activeWarns) {
        const member = await server.member(activeWarn as Snowflake);
        if (member) {
          const expDate = activeWarns[activeWarn];
          const remain = expDate - Date.now();
          setTimeout(async () => removeWarn(server, member), remain);
        }
      }
    });
  }

  private async messageReactionAdd(reaction: MessageReaction, user: User): Promise<void> {
    await reaction.fetch();
    const message = reaction.message as Message;

    const warneableEntities = [
      "GUILD_TEXT",
      "GUILD_PUBLIC_THREAD",
      "GUILD_NEWS",
      "GUILD_NEWS_THREAD",
    ];
    // I can only react to messages sent to guild text channels.
    if (warneableEntities.includes(reaction.message.channel.type) || !reaction.message.guild) {
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
        message,
        duration: 86400 * 1000 * 7,
      });
    } else if (reaction.emoji.name === "🗑️" && isMessageWarned(message)) {
      await applyWastebin(message);
    }
  }
}
