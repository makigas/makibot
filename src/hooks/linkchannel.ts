import {
  GuildMember,
  Message,
  NewsChannel,
  TextBasedChannel,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import { userMention } from "@discordjs/builders";
import getUrls from "get-urls";
import { Hook } from "../lib/hook";
import { quoteMessage } from "../lib/response";
import Server from "../lib/server";

/**
 * Deals with the draconian rules that power our link-based channels, such as #enlaces,
 * where it is only allowed to post messages that have links, forcing discussions to
 * happen inside thread channels.
 *
 * This hook will do the following:
 *
 * - Whenever a message with a link is posted, it will open a thread for that specific
 *   message, so that people can keep up with the conversation inside the thread for
 *   that specific message.
 * - Whenever a message without a link is posted, it will be deleted.
 */
export default class LinkChannel implements Hook {
  name = "link";

  async onMessageCreate(msg: Message): Promise<void> {
    if (
      isLinkableChannel(msg.channel) &&
      isManagedLinkChannel(msg.channel) &&
      isAcceptableUser(msg.member)
    ) {
      return handleMessage(msg);
    }
  }
}

/** We monitor these kinds of channels. */
type LinkableChannel = TextChannel | NewsChannel;

function isAcceptableUser(gm: GuildMember): boolean {
  return gm.user && !gm.user.bot;
}

/** Tests and coerces this channel into an acceptable channel type we monitor. */
function isLinkableChannel(channel: TextBasedChannel): channel is LinkableChannel {
  const types = ["GUILD_NEWS", "GUILD_TEXT"];
  return types.includes(channel.type);
}

/** Tests whether the given channel should behave as a link-based channel. */
function isManagedLinkChannel(channel: LinkableChannel) {
  if (channel.guild) {
    const server = new Server(channel.guild);
    const linkables = server.tagbag.tag("linkchannels").get([]);
    return linkables.includes(channel.id);
  }
  return false;
}

async function handleMessage(msg: Message): Promise<void> {
  const firstUrl = getFirstLink(msg);
  if (firstUrl) {
    /* Message has a link, AOK. */
    await startThread(msg);
  } else {
    if (msg.reference?.messageId) {
      /* Message references another message, let's try to embed it. */
      await nestMessage(msg);
    }
    /* Sorry, we can't do anything. */
    await destroyMessage(msg);
  }
}

function getFirstLink(msg: Message): string | null {
  const urls = getUrls(msg.cleanContent);
  if (urls.size > 0) {
    return [...urls][0];
  } else {
    return null;
  }
}

/** Handler when the message is valid and should start a thread. */
function startThread(msg: Message): Promise<ThreadChannel> {
  const name = `${msg.id}`;
  return msg.startThread({ name });
}

/** Handler when the message was replied to, to try to put the reply in the thread. */
async function nestMessage(msg: Message): Promise<void> {
  const references = await msg.fetchReference();
  if (references.hasThread) {
    const quote = quoteMessage(msg);
    await references.thread.send({
      ...quote,
      content: `${userMention(msg.author.id)} quiso decir:`,
    });
  }
}

/** Handler when the message is totally not valid and should be disposed. */
async function destroyMessage(msg: Message): Promise<void> {
  await msg.delete();
}
