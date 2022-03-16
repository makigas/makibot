import {
  GuildMember,
  Message,
  NewsChannel,
  PartialMessage,
  TextBasedChannel,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import { userMention } from "@discordjs/builders";
import getUrls from "get-urls";
import og from "open-graph";
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
      (await isManagedLinkChannel(msg.channel)) &&
      isAcceptableUser(msg.member)
    ) {
      return handleMessage(msg);
    }
  }

  async onMessageDestroy?(msg: PartialMessage): Promise<void> {
    if (
      isLinkableChannel(msg.channel) &&
      (await isManagedLinkChannel(msg.channel)) &&
      isAcceptableUser(msg.member) &&
      msg.hasThread
    ) {
      await msg.thread.setLocked(true, "Original message got deleted");
      await msg.thread.setArchived(true, "Original message got deleted");
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
async function isManagedLinkChannel(channel: LinkableChannel): Promise<boolean> {
  if (channel.guild) {
    const server = new Server(channel.guild);
    const linkables = await server.tagbag.tag("linkchannels").get([]);
    return linkables.includes(channel.id);
  }
  return false;
}

async function handleMessage(msg: Message): Promise<void> {
  const firstUrl = getFirstLink(msg);
  if (firstUrl) {
    /* Message has a link, AOK. */
    await startThread(msg, firstUrl);
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

async function getTitle(url: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    og(url, function (err, meta) {
      if (err) {
        reject(err);
      } else {
        if (meta.title) {
          if (Array.isArray(meta.title)) {
            resolve(meta.title[0] as string);
          } else if (typeof meta.title === "string") {
            resolve(meta.title as string);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      }
    });
  });
}

/** Handler when the message is valid and should start a thread. */
function startThread(msg: Message, url: string): Promise<ThreadChannel> {
  return getTitle(url).then((title) => {
    if (title) {
      console.log({ title, length: title.length });
      if (title.length > 80) {
        const name = `${title.substring(0, 80)}... (comentarios)`;
        console.log({ name, on: "first" });
        return msg.startThread({ name });
      } else {
        const name = `${title} (comentarios)`;
        console.log({ name, on: "second" });
        return msg.startThread({ name });
      }
    } else {
      const name = `${msg.id} (comentarios)`;
      console.log({ name, on: "third" });
      return msg.startThread({ name });
    }
  });
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
