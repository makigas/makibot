import {
  GuildMember,
  Message,
  NewsChannel,
  PartialMessage,
  TextBasedChannel,
  TextChannel,
} from "discord.js";
import { Hook } from "../lib/hook";
import Server from "../lib/server";

/**
 * Whenever a message is posted in a channel, it will open a thread for it.
 * Handles the draconian rules that power some channels where communication
 * should always be managed in threads.
 */
export default class ThreadChannelService implements Hook {
  name = "threads";

  async onMessageCreate(msg: Message): Promise<void> {
    if (
      isThreadableChannel(msg.channel) &&
      (await isManagedThreadChannel(msg.channel)) &&
      isAcceptableUser(msg.member)
    ) {
      await startThread(msg);
    }
  }

  async onMessageDestroy?(msg: PartialMessage): Promise<void> {
    if (
      isThreadableChannel(msg.channel) &&
      (await isManagedThreadChannel(msg.channel)) &&
      isAcceptableUser(msg.member) &&
      msg.hasThread
    ) {
      await msg.thread.setLocked(true, "Original message got deleted");
      await msg.thread.setArchived(true, "Original message got deleted");
    }
  }
}

type ThreadableChannel = TextChannel | NewsChannel;

/** Test if the channel can be managed and coerces into a threadable channel. */
function isThreadableChannel(channel: TextBasedChannel): channel is ThreadableChannel {
  return ["GUILD_TEXT", "GUILD_NEWS"].includes(channel.type);
}

/** Tests whether the given channel should behave as a thread-based channel. */
async function isManagedThreadChannel(channel: ThreadableChannel): Promise<boolean> {
  if (channel.guild) {
    const server = new Server(channel.guild);
    const linkables = await server.tagbag.tag("threadchannels").get([]);
    return linkables.includes(channel.id);
  }
  return false;
}

function isAcceptableUser(gm: GuildMember): boolean {
  return gm.user && !gm.user.bot;
}

async function startThread(msg: Message): Promise<void> {
  const name = `${msg.id}`;
  await msg.startThread({ name });
}
