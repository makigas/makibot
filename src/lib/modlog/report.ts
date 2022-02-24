import { hyperlink, userMention } from "@discordjs/builders";
import { Message, MessageEmbedOptions, TextChannel } from "discord.js";
import Makibot from "../../Makibot";
import Server from "../server";

function buildModReport(message: Message, reason: string): MessageEmbedOptions {
  return {
    footer: {
      iconURL:
        "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/247/page-with-curl_1f4c3.png",
      text: "Mensaje de moderación automática",
    },
    color: 0xde2a42,
    author: {
      iconURL:
        "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/282/triangular-flag_1f6a9.png",
      name: "Se ha alertado sobre un mensaje inapropiado",
    },
    fields: [
      {
        name: "Usuario",
        value: `${userMention(message.author.id)} (${message.author.id})`,
      },
      {
        name: "UID de mensaje",
        value: `${hyperlink(message.id, message.url)}`,
      },
      {
        name: "Canal",
        value: `${hyperlink((message.channel as TextChannel).name, message.url)}`,
      },
      {
        name: "Razón",
        value: reason,
      },
    ],
  };
}

export async function proposeReport(
  client: Makibot,
  message: Message,
  reason: string,
  target: "default" | "sensible" = "default"
) {
  const embed = buildModReport(message, reason);
  const server = new Server(message.guild);
  return server.sendToModlog(target, {
    embeds: [embed],
    username: embed.author.name,
    avatarURL: embed.author.iconURL,
  });
}
