import { Channel, GuildMember, Message, MessageReaction, TextChannel, User } from "discord.js";
import { Hook } from "../lib/hook";
import { KarmaDatabase, openKarmaDatabase } from "../lib/karma/database";
import Member from "../lib/member";
import Makibot from "../Makibot";
import { getKarmaDatabase } from "../settings";

async function prefetchMessage(message: Message): Promise<Message> {
  if (message.partial) {
    await message.fetch();
  }
  return message;
}

async function prefetchReaction(mr: MessageReaction): Promise<MessageReaction> {
  if (mr.partial) {
    await mr.fetch();
  }
  if (mr.message.partial) {
    await mr.message.fetch();
  }
  return mr;
}

function isTextChannel(channel: Channel): channel is TextChannel {
  return channel.type == "text";
}

function canReceivePoints(gm: GuildMember): boolean {
  if (!gm) {
    return false;
  }
  const member = new Member(gm);
  return !gm.user.bot && member.verified;
}

export default class KarmaService implements Hook {
  name = "karma";

  private karma: KarmaDatabase;

  constructor(bot: Makibot) {
    getKarmaDatabase()
      .then((dbFile) => {
        openKarmaDatabase(dbFile)
          .then((db) => {
            this.karma = db;
            bot.on("message", (msg) =>
              prefetchMessage(msg).then((msg) => this.onReceivedMessage(msg))
            );
            bot.on("messageDelete", (msg) =>
              prefetchMessage(msg).then((msg) => this.onDeletedMessage(msg))
            );
            bot.on("messageReactionAdd", (reaction, user) =>
              prefetchReaction(reaction).then((reaction) => this.onReactedTo(reaction, user))
            );
            bot.on("messageReactionRemove", (reaction, user) =>
              prefetchReaction(reaction).then((reaction) => this.onUnreactedTo(reaction, user))
            );
            bot.on("messageReactionRemoveAll", (msg) =>
              prefetchMessage(msg).then((msg) => this.onUnreactedToAll(msg))
            );
          })
          .catch((e) => {
            console.error(e);
          });
      })
      .catch((e) => {
        console.error(e);
      });
  }

  private async onReceivedMessage(message: Message): Promise<void> {
    if (!canReceivePoints(message.member)) {
      return;
    }
    const lastMinutePoints = await this.karma.count(message.author.id, {
      kind: "message",
      seconds: 60,
    });
    if (lastMinutePoints > 0) {
      return;
    }
    await this.karma.action({
      actorId: message.id,
      actorType: "Message",
      kind: "message",
      points: 1,
      originatorId: message.author.id,
      target: message.author.id,
    });

    const channel = message.channel;
    if (isTextChannel(channel)) {
      await this.assertLevel(message.member, channel);
    }
  }

  private async onDeletedMessage(message: Message): Promise<void> {
    await this.karma.undoAction({ actorId: message.id, actorType: "Message", kind: "upvote" });
    await this.karma.undoAction({
      actorId: message.id,
      kind: "message",
      originatorId: message.author.id,
      actorType: "Message",
    });
  }

  private async onReactedTo(reaction: MessageReaction, user: User): Promise<void> {
    if (
      !canReceivePoints(reaction.message.member) ||
      user.bot ||
      reaction.message.author.id == user.id
    ) {
      return;
    }
    switch (reaction.emoji.name) {
      case "👍": {
        await this.karma.action({
          actorId: reaction.message.id,
          actorType: "Message",
          kind: "upvote",
          points: 1,
          originatorId: user.id,
          target: reaction.message.author.id,
        });
        break;
      }
      case "👎": {
        await this.karma.action({
          actorId: reaction.message.id,
          actorType: "Message",
          kind: "downvote",
          points: -1,
          originatorId: user.id,
          target: reaction.message.author.id,
        });
        break;
      }
      case "⭐": {
        await this.karma.action({
          actorId: reaction.message.id,
          actorType: "Message",
          kind: "star",
          points: 3,
          originatorId: user.id,
          target: reaction.message.author.id,
        });
        break;
      }
    }

    const channel = reaction.message.channel;
    if (isTextChannel(channel)) {
      await this.assertLevel(reaction.message.member, channel);
    }
  }

  private async onUnreactedTo(reaction: MessageReaction, user: User): Promise<void> {
    switch (reaction.emoji.name) {
      case "👍": {
        await this.karma.undoAction({
          actorId: reaction.message.id,
          actorType: "Message",
          kind: "upvote",
          originatorId: user.id,
        });
        break;
      }
      case "👎": {
        await this.karma.undoAction({
          actorId: reaction.message.id,
          actorType: "Message",
          kind: "downvote",
          originatorId: user.id,
        });
        break;
      }
      case "⭐": {
        await this.karma.undoAction({
          actorId: reaction.message.id,
          actorType: "Message",
          kind: "star",
          originatorId: user.id,
        });
        break;
      }
    }
  }

  private async onUnreactedToAll(message: Message): Promise<void> {
    await this.karma.undoAction({
      actorId: message.id,
      actorType: "Message",
      kind: "upvote",
    });
    await this.karma.undoAction({
      actorId: message.id,
      actorType: "Message",
      kind: "downvote",
    });
    await this.karma.undoAction({
      actorId: message.id,
      actorType: "Message",
      kind: "star",
    });
  }

  private async assertLevel(gm: GuildMember, channel: TextChannel): Promise<void> {
    const points = await this.karma.count(gm.id);
    const expectedLevel = Math.trunc(points / 50) + 1;

    const member = new Member(gm);
    const currentLevel = member.tagbag.tag("karma:level");
    if (currentLevel.get(0) != expectedLevel) {
      currentLevel.set(expectedLevel);
      const highScoreLevel = member.tagbag.tag("karma:max");
      if (highScoreLevel.get(0) < expectedLevel) {
        highScoreLevel.set(expectedLevel);
        channel.send(`¡Enhorabuena, <@${gm.id}>, has alcanzado el nivel ${expectedLevel}!`);
      }
    }
  }
}
