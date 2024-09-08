import { hyperlink, userMention } from "@discordjs/builders";
import { Message, MessageEmbedOptions, TextChannel, WebhookMessageOptions } from "discord.js";
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

/**
 * This is the main handler for the modmenu action, allowing users to notify
 * mods about a specific message so that they can propose an action such as
 * banning, kicking, timeouting or doing nothing.

 * @param message the message that is being proposed
 * @param reason the reason on why the message should be moderated
 * @param target the modlog where the proposal should be sent
 * @returns a promise that resolves once the proposal has been saved
 */
export async function proposeReport(message: Message, reason: string) {
  if (!message.guild) {
    throw new Error("Missing guild information for the reported message");
  }
  const embed = buildModReport(message, reason);
  const server = new Server(message.guild);
  const payload: WebhookMessageOptions = { embeds: [embed] };
  if (embed.author) {
    payload.username = embed.author.name;
    payload.avatarURL = embed.author.iconURL;
  }
  return server.sendToModlog("default", payload);
}
