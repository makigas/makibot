import {
  Channel,
  GuildMember,
  Message,
  MessageReaction,
  PartialMessage,
  PartialUser,
  TextChannel,
  User,
} from "discord.js";
import { Hook } from "../lib/hook";
import { canReceivePoints, getLevel, getLevelUpMessage } from "../lib/karma";
import { KarmaDatabase } from "../lib/karma/database";
import Member from "../lib/member";
import Makibot from "../Makibot";

async function prefetchMessage(message: Message | PartialMessage): Promise<Message> {
  if (message.partial) {
    await message.fetch();
  }
  return message as Message;
}

async function prefetchUser(user: User | PartialUser): Promise<User> {
  if (user.partial) {
    return user.fetch();
  } else {
    return user as User;
  }
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

const REACTIONS: { [reaction: string]: { kind: string; score: number } } = {
  "👍": {
    kind: "upvote",
    score: 1,
  },
  "❤️": {
    kind: "heart",
    score: 1,
  },
  "👎": {
    kind: "downvote",
    score: -1,
  },
  "⭐": {
    kind: "star",
    score: 3,
  },
};

export default class KarmaService implements Hook {
  name = "karma";

  constructor(private bot: Makibot) {
    bot.on("message", (msg) => prefetchMessage(msg).then((msg) => this.onReceivedMessage(msg)));
    bot.on("messageDelete", (msg) =>
      prefetchMessage(msg).then((msg) => this.onDeletedMessage(msg))
    );
    bot.on("messageReactionAdd", (reaction, user) =>
      prefetchReaction(reaction).then((reaction) =>
        prefetchUser(user).then((user) => this.onReactedTo(reaction, user))
      )
    );
    bot.on("messageReactionRemove", (reaction, user) =>
      prefetchReaction(reaction).then((reaction) =>
        prefetchUser(user).then((user) => this.onUnreactedTo(reaction, user))
      )
    );
    bot.on("messageReactionRemoveAll", (msg) =>
      prefetchMessage(msg).then((msg) => this.onUnreactedToAll(msg))
    );
  }

  /* Made as a getter so that we can defer accessing the karma db until the very last moment. */
  private get karma(): KarmaDatabase {
    return this.bot.karma;
  }

  private async onReceivedMessage(message: Message): Promise<void> {
    if (!canReceivePoints(message.member)) {
      return;
    }
    /* Bot commands cannot be given karma. */
    if (message.cleanContent.startsWith("!")) {
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
    await Promise.all(
      ["upvote", "downvote", "star", "heart"].map((kind) =>
        this.karma.undoAction({
          actorId: message.id,
          actorType: "Message",
          kind,
        })
      )
    );
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
    /* Bot commands cannot be given karma. */
    if (reaction.message.cleanContent.startsWith("!")) {
      return;
    }
    const reactionSpec = REACTIONS[reaction.emoji.name];
    if (reactionSpec) {
      await this.karma.action({
        actorId: reaction.message.id,
        actorType: "Message",
        kind: reactionSpec.kind,
        points: reactionSpec.score,
        originatorId: user.id,
        target: reaction.message.author.id,
      });
    }

    const channel = reaction.message.channel;
    if (isTextChannel(channel)) {
      await this.assertLevel(reaction.message.member, channel);
    }
  }

  private async onUnreactedTo(reaction: MessageReaction, user: User): Promise<void> {
    const reactionSpec = REACTIONS[reaction.emoji.name];
    if (reactionSpec) {
      await this.karma.undoAction({
        actorId: reaction.message.id,
        actorType: "Message",
        kind: reactionSpec.kind,
        originatorId: user.id,
      });
    }
  }

  private async onUnreactedToAll(message: Message): Promise<void> {
    await Promise.all(
      ["upvote", "downvote", "star", "heart"].map((kind) =>
        this.karma.undoAction({
          actorId: message.id,
          actorType: "Message",
          kind,
        })
      )
    );
  }

  private async assertLevel(gm: GuildMember, channel: TextChannel): Promise<void> {
    const member = new Member(gm);
    const points = member.tagbag.tag("karma:offset").get(0) + (await this.karma.count(gm.id));
    const expectedLevel = getLevel(points);

    const currentLevel = member.tagbag.tag("karma:level");
    if (currentLevel.get(0) != expectedLevel) {
      currentLevel.set(expectedLevel);

      const highScoreLevel = member.tagbag.tag("karma:max");
      if (highScoreLevel.get(0) < expectedLevel) {
        highScoreLevel.set(expectedLevel);

        /* A temporal fix to avoid spamming messages to most existing members. */
        if (!member.trusted || expectedLevel > 1) {
          channel.send(getLevelUpMessage(gm.id, expectedLevel));
        }
      }
    }

    /* Update presence in the tiers. */
    member.setCrew(currentLevel.get(0));
  }
}
