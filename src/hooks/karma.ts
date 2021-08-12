import {
  Channel,
  GuildMember,
  Message,
  MessageReaction,
  PartialMessage,
  PartialUser,
  TextBasedChannels,
  TextChannel,
  User,
} from "discord.js";
import { Hook } from "../lib/hook";
import { canReceivePoints, getLevelV2 } from "../lib/karma";
import { KarmaDatabase } from "../lib/karma/database";
import Member from "../lib/member";
import { createToast } from "../lib/response";
import Server from "../lib/server";
import { notifyPublicModlog } from "../lib/warn";
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

function isTextChannel(channel: TextBasedChannels): channel is TextChannel {
  return channel.type == "GUILD_TEXT" || channel.type == "GUILD_PUBLIC_THREAD" || channel.type === "GUILD_NEWS";
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
  "👋": {
    kind: "wave",
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
      reaction.fetch().then((reaction) =>
        prefetchUser(user).then((user) => this.onReactedTo(reaction, user))
      )
    );
    bot.on("messageReactionRemove", (reaction, user) =>
      reaction.fetch().then((reaction) =>
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
    if (!canReceivePoints(message.member) || message.type !== "DEFAULT") {
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
      ["upvote", "downvote", "star", "heart", "wave"].map((kind) =>
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
      ["upvote", "downvote", "star", "heart", "wave"].map((kind) =>
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
    const karma = await member.getKarma();

    /*
     * Control mute for members with negative karma.
     * TODO: This is an ugly patch. Negative levels should be fixed (and not return -1).
     * Members with negative level should be the ones muted.
     */
    if (karma.points <= -3) {
      /* First, make sure this person is silenced. */
      await member.setMuted(true);

      /* Then, notify the member about this unless already done. */
      const alreadyWarnedTag = member.tagbag.tag("karma:mutenotified");
      if (!alreadyWarnedTag.get(false)) {
        notifyPublicModlog(
          new Server(gm.guild),
          member,
          `Has sido silenciado automáticamente, <@${gm.user.id}>`,
          "Silenciado automáticamente al tener karma excesivamente negativo"
        );
        await alreadyWarnedTag.set(true);
      }
    }

    const currentLevel = member.tagbag.tag("karma:level");
    const expectedLevel = getLevelV2(karma.points);
    if (currentLevel.get(0) != expectedLevel) {
      await currentLevel.set(expectedLevel);

      const highScoreLevel = member.tagbag.tag("karma:max");
      if (highScoreLevel.get(0) < expectedLevel) {
        await highScoreLevel.set(expectedLevel);
        if (expectedLevel === 1) {
          /* First message. */
          const toast = createToast({
            title: `¡Es el primer mensaje de @${gm.user.username}!`,
            description: [
              `Parece que este es el primer mensaje de @${gm.user.username} en este servidor.`,
              "¡Te damos la bienvenida, este servidor es mejor ahora que estás aquí!",
              "Pásalo bien y disfruta en la comunidad.",
            ].join(" "),
            severity: "success",
            target: gm.user,
          });
          await channel.send({ embeds: [toast] });
        } else {
          const toast = createToast({
            title: `¡@${gm.user.username} ha subido al nivel ${expectedLevel}!`,
            severity: "success",
            target: gm.user,
          });
          await channel.send({ embeds: [toast] });
        }
      }
    }

    /* Update presence in the tiers. */
    await member.setCrew(currentLevel.get(0));
  }
}
