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
import { applyAction } from "../lib/modlog/actions";
import { notifyModlog } from "../lib/modlog/notifications";
import { createToast } from "../lib/response";
import Server from "../lib/server";
import Makibot from "../Makibot";

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
  "⭐": {
    kind: "star",
    score: 3,
  },
};

export default class KarmaService implements Hook {
  name = "karma";

  constructor(private bot: Makibot) {}

  /* Made as a getter so that we can defer accessing the karma db until the very last moment. */
  private get karma(): KarmaDatabase {
    return this.bot.karma;
  }

  async onGuildMemberJoin(member: GuildMember): Promise<void> {
    const server = new Server(member.guild);
    const serverMember = await server.member(member);
    await this.checkMemberLevel(serverMember);
  }

  async onMessageCreate(message: Message): Promise<void> {
    if (
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

    const channel = message.channel;
    if (isTextChannel(channel)) {
      await this.assertLevel(message.member, channel);
    }
  }

  async onMessageDestroy(message: PartialMessage): Promise<void> {
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

  async onMessageReactionAdd(reaction: MessageReaction, user: User): Promise<void> {
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

  async onMessageReactionDestroy(reaction: MessageReaction, user: User): Promise<void> {
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

  async onMessageReactionBulkDestroy(message: Message): Promise<void> {
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

  /**
   * When an account reaches a reputation that is too low, the account will be automatically
   * muted. Muting an account prevents the account from sending more messages. It has to be
   * manually unlocked by a moderator to allow the account to talk again.
   *
   * @param gm the guild member to mute due to low reputation.
   */
  private async muteLowReputation(member: Member): Promise<void> {
    const alreadyMuted = member.tagbag.tag("karma:mutenotified");

    if (!alreadyMuted.get(false)) {
      const persisted = await applyAction(this.bot, {
        createdAt: new Date(),
        expiresAt: null,
        expired: false,
        type: "MUTE",
        mod: this.bot.user.id,
        reason: "(cuenta silenciada automáticamente debido al nivel de reputación)",
        target: member.id,
        guild: member.server.id,
      });
      await notifyModlog(this.bot, persisted);
      await alreadyMuted.set(true);
    }
  }

  private async assertLevel(gm: GuildMember, channel: TextChannel): Promise<void> {
    const member = new Member(gm);
    const karma = await member.getKarma();

    /* If an account reaches a very low reputation level, should be muted. */
    if (karma.points <= -3) {
      return this.muteLowReputation(member);
    }

    const currentLevelTag = member.tagbag.tag("karma:level");
    const expectedLevel = getLevelV2(karma.points);
    const currentLevel = await currentLevelTag.get(0);
    if (currentLevel != expectedLevel) {
      await currentLevelTag.set(expectedLevel);

      const highScoreTag = member.tagbag.tag("karma:max");
      const highScoreValue = await highScoreTag.get(0);
      if (highScoreValue < expectedLevel) {
        await highScoreTag.set(expectedLevel);
        if (expectedLevel === 1) {
          /* First message. */
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
            title: `¡@${gm.user.username} ha subido al nivel ${expectedLevel}!`,
            severity: "success",
            target: gm.user,
          });
          await channel.send({ embeds: [toast] });
        }
      }
    }

    // Always do this, even if the level does not change, in case the user
    // has lost the color for some reason or mistake in the server.
    await this.checkMemberLevel(member);
  }

  private async checkMemberLevel(member: Member): Promise<void> {
    const currentLevelTag = member.tagbag.tag("karma:level");
    const currentLevel = await currentLevelTag.get(0);
    await member.setCrew(currentLevel);
  }
}
