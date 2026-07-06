import { Guild, GuildMember, Message } from "discord.js";
import { Hook } from "../lib/hook";
import logger from "../lib/logger";

const BURST_WINDOW_MS = 2_000;
const MIN_DISTINCT_CHANNELS = 3;
const TIMEOUT_MS = 60 * 60 * 1_000;
const TIMEOUT_REASON = "Spam de adjuntos en varios canales";

interface TrackedBurst {
  messages: Message[];
  cleanup: ReturnType<typeof setTimeout>;
}

function isTrackableAttachmentMessage(
  message: Message,
): message is Message & { guild: Guild; member: GuildMember } {
  return (
    message.inGuild() &&
    message.member !== null &&
    !message.author.bot &&
    message.attachments.size > 0
  );
}

/**
 * Tracks attachment messages briefly so that a burst can be detected without
 * persisting every message to the settings database.
 */
class AttachmentBurstTracker {
  private readonly bursts = new Map<string, TrackedBurst>();

  observe(message: Message): Message[] | null {
    if (!isTrackableAttachmentMessage(message)) {
      return null;
    }

    const key = `${message.guild.id}:${message.author.id}`;
    const previous = this.bursts.get(key);
    const lastMessage = previous?.messages.at(-1);
    const continuesBurst =
      lastMessage && message.createdTimestamp - lastMessage.createdTimestamp <= BURST_WINDOW_MS;
    const messages = previous && continuesBurst ? previous.messages.concat(message) : [message];

    if (previous) {
      clearTimeout(previous.cleanup);
    }

    const channels = new Set(messages.map((candidate) => candidate.channel.id));
    if (channels.size >= MIN_DISTINCT_CHANNELS) {
      this.bursts.delete(key);
      return messages;
    }

    const burst: TrackedBurst = {
      messages,
      cleanup: setTimeout(() => {
        if (this.bursts.get(key) === burst) {
          this.bursts.delete(key);
        }
      }, BURST_WINDOW_MS),
    };
    burst.cleanup.unref();
    this.bursts.set(key, burst);
    return null;
  }
}

export default class MrbeastService implements Hook {
  name = "beast";

  private readonly tracker = new AttachmentBurstTracker();

  async onMessageCreate(message: Message): Promise<void> {
    const burst = this.tracker.observe(message);
    if (!burst || !message.member) {
      return;
    }

    logger.info(
      `[beast] detected ${burst.length} attachment messages from ${message.author.tag} ` +
        `across ${new Set(burst.map((candidate) => candidate.channel.id)).size} channels`,
    );
    await applyMitigation(message.member, burst);
  }
}

async function applyMitigation(member: GuildMember, messages: Message[]): Promise<void> {
  const actions = [
    member.disableCommunicationUntil(Date.now() + TIMEOUT_MS, TIMEOUT_REASON),
    ...messages.map((message) => message.delete()),
  ];
  const results = await Promise.allSettled(actions);

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const action = index === 0 ? "timeout" : `delete message ${messages[index - 1].id}`;
      logger.error(`[beast] failed to ${action}`, result.reason);
    }
  });
}
