import { userMention } from "@discordjs/builders";
import {
  GuildMember,
  Message,
  MessageActionRow,
  MessageButton,
  NewsChannel,
  PartialMessage,
  TextBasedChannel,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import { Hook } from "../lib/hook";
import Member from "../lib/member";
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
    const threadables = await server.getThreadChannels();
    return threadables.includes(channel.id);
  }
  return false;
}

function isAcceptableUser(gm: GuildMember): boolean {
  return gm.user && !gm.user.bot;
}

async function startThread(msg: Message): Promise<void> {
  const name = `${msg.author.username} - ${msg.id}`;
  const thread = await msg.startThread({ name });
  const member = new Member(msg.member);
  const snoozed = await member.threadChannelNotificationsSnoozed();
  if (!snoozed) {
    await sendInitial(msg, thread);
  }
}

async function sendInitial(msg: Message, thread: ThreadChannel): Promise<void> {
  const template = [
    `¡Hola, ${userMention(msg.author.id)}! Te he abierto un hilo para que se pueda continuar`,
    `aquí una conversación sobre el mensaje que has enviado. Puedes utilizar los siguientes comandos para controlar tu hilo:\n`,
    "▪ Utiliza `/renombrar` para cambiarle el título al hilo. Por ejemplo, `/renombrar javascript no funciona mi fizzbuzz`\n",
    "▪ Utiliza `/archivar` si quieres archivar tu hilo en cualquier momento.",
  ].join(" ");
  const row = new MessageActionRow({
    components: [
      new MessageButton({
        style: "PRIMARY",
        label: `Vale, no me vuelvas a decir esto en un mes`,
        customId: `dont_remind_question`,
        emoji: "✅",
      }),
    ],
  });
  await thread.send({
    content: template,
    components: [row],
  });
}
