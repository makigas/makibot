import {
  GuildMember,
  Message,
  MessageReaction,
  PartialMessage,
  TextBasedChannel,
  TextChannel,
  User,
} from "discord.js";
import { Hook } from "../lib/hook";
import { canReceivePoints, getLevelV2 } from "../lib/karma";
import { KarmaDatabase } from "../lib/karma/database";
import Member from "../lib/member";
import { createToast } from "../lib/response";
import Server from "../lib/server";
import Makibot from "../Makibot";
import AsyncLock from "async-lock";
import logger from "../lib/logger";

function isTextChannel(channel: TextBasedChannel): channel is TextChannel {
  return (
    channel.type == "GUILD_TEXT" ||
    channel.type == "GUILD_PUBLIC_THREAD" ||
    channel.type === "GUILD_NEWS"
  );
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
};

interface PendingLevelCheck {
  member: GuildMember;
  channel: TextChannel;
}

export default class KarmaService implements Hook {
  name = "karma";

  private pending: Map<string, PendingLevelCheck>;
  private lock: AsyncLock;

  constructor(private bot: Makibot) {
    this.pending = new Map();
    this.lock = new AsyncLock();
    setInterval(() => this.doLevelCheck(), 5000);
  }

  private deferLevelCheck(member: GuildMember, channel: TextChannel) {
    this.lock.acquire('check', async () => {
      logger.trace("[karma] defering level check for " + member.id);
      this.pending.set(member.id, { member, channel });
    }).then(() => {});
  }

  private doLevelCheck() {
    logger.trace("[karma] checking levels...");
    this.lock.acquire('check', async () => {
      for (const pending of this.pending.values()) {
        logger.trace("[karma] checking levels for " + pending.member.id);
        this.assertLevel(pending.member, pending.channel);
      }
      this.pending.clear();
    }).then(() => {});
  }

  /* Made as a getter so that we can defer accessing the karma db until the very last moment. */
  private get karma(): KarmaDatabase {
    return this.bot.karma;
  }

  async onGuildMemberJoin(member: GuildMember): Promise<void> {
    const server = new Server(member.guild);
    const serverMember = await server.member(member);
    if (serverMember) {
      await this.checkMemberLevel(serverMember);
    }
  }

  async onMessageCreate(message: Message): Promise<void> {
    if (
      !message.member ||
      !canReceivePoints(message.member) ||
      (message.type !== "DEFAULT" && message.type !== "REPLY")
    ) {
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
    if (isTextChannel(message.channel)) {
      this.deferLevelCheck(message.member, message.channel);
    }
  }

  async onMessageDestroy(message: Message | PartialMessage): Promise<void> {
    await Promise.all(
      ["upvote", "downvote", "star", "heart", "wave"].map((kind) =>
        this.karma.undoAction({
          actorId: message.id,
          actorType: "Message",
          kind,
        }),
      ),
    );
    await this.karma.undoAction({
      actorId: message.id,
      kind: "message",
      originatorId: message.author?.id,
      actorType: "Message",
    });
  }

  async onMessageReactionAdd(reaction: MessageReaction, user: User): Promise<void> {
    if (
      !reaction.message.member ||
      !reaction.message.author ||
      !canReceivePoints(reaction.message.member) ||
      user.bot ||
      reaction.message.author.id == user.id
    ) {
      return;
    }
    const reactionSpec = reaction.emoji?.name && REACTIONS[reaction.emoji.name];
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
    if (isTextChannel(reaction.message.channel)) {
      this.deferLevelCheck(reaction.message.member, reaction.message.channel);
    }
  }

  async onMessageReactionDestroy(reaction: MessageReaction, user: User): Promise<void> {
    const reactionSpec = reaction.emoji?.name && REACTIONS[reaction.emoji.name];
    if (reactionSpec) {
      await this.karma.undoAction({
        actorId: reaction.message.id,
        actorType: "Message",
        kind: reactionSpec.kind,
        originatorId: user.id,
      });
    }
  }

  async onMessageReactionBulkDestroy(message: Message): Promise<void> {
    await Promise.all(
      ["upvote", "downvote", "heart", "wave"].map((kind) =>
        this.karma.undoAction({
          actorId: message.id,
          actorType: "Message",
          kind,
        }),
      ),
    );
  }

  private async assertLevel(gm: GuildMember, channel: TextChannel): Promise<void> {
    const member = new Member(gm);
    const karma = await member.getKarma();
    const expectedLevel = getLevelV2(karma.points);

    // Check if the account has leveled up.
    const currentLevelTag = member.tagbag.tag("karma:level");
    const currentLevel = await currentLevelTag.get(0);
    if (currentLevel != expectedLevel) {
      await currentLevelTag.set(expectedLevel);

      // Check if the account has reached this level for the first time.
      const highScoreTag = member.tagbag.tag("karma:max");
      const highScoreValue = await highScoreTag.get(0);
      if (highScoreValue < expectedLevel) {
        await highScoreTag.set(expectedLevel);

        // Send a notification, only the first time this level is reached.
        await this.sendNotification(channel, gm, expectedLevel);
      }
    }

    // Always do this, even if the level does not change, in case the user
    // has lost the color for some reason or mistake in the server.
    await this.checkMemberLevel(member);
  }

  private async checkMemberLevel(member: Member): Promise<void> {
    const currentLevelTag = member.tagbag.tag("karma:level");
    const currentLevel = await currentLevelTag.get(0);
    await member.setKarmaVanityLevel(currentLevel);
  }

  private async sendNotification(channel: TextChannel, gm: GuildMember, level: number) {
    if (level === 1) {
      const toast = createToast({
        title: `¡Es el primer mensaje de @${gm.user.username}!`,
        description: [
          `¡Ey! Este es el primer mensaje de @${gm.user.username} en este servidor.`,
          "¡Te damos la bienvenida, esperamos que estés bien y te damos las gracias por",
          "participar en este servidor!",
        ].join(" "),
        severity: "success",
        target: gm.user,
      });
      await channel.send({ embeds: [toast] });
    } else {
      const toast = createToast({
        title: `¡@${gm.user.username} ha subido al nivel ${level}!`,
        severity: "success",
        target: gm.user,
      });
      await channel.send({ embeds: [toast] });
    }
  }
}
