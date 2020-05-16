import { Message } from "discord.js";

export function getURL(message: Message): string {
  const server = message.guild.id;
  const channel = message.channel.id;
  const post = message.id;
  return `https://discordapp.com/channels/${server}/${channel}/${post}`;
}
