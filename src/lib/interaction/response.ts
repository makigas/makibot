import axios from "axios";
import { APIEmbed, APIGuildInteraction, APIInteractionResponse } from "discord-api-types/v9";
import { MessageEmbed, MessageEmbedOptions } from "discord.js";
import logger from "../logger";

function translateEmbed(embed: MessageEmbed | MessageEmbedOptions): APIEmbed {
  /* Only the properties that this bot use. */
  const payload: APIEmbed = {
    title: embed.title,
    description: embed.description,
    thumbnail: embed.thumbnail,
    author: embed.author,
    fields: embed.fields,
  };
  if (embed.color) {
    payload.color = embed.color as number;
  }
  return payload;
}

export interface ResponseOptions {
  embed?: MessageEmbed | MessageEmbedOptions;
  ephemeral?: boolean;
  content?: string;
}

export async function sendResponse(
  event: APIGuildInteraction,
  response: ResponseOptions
): Promise<void> {
  const payload: APIInteractionResponse = {
    type: 4,
    data: {
      content: response.content,
      embeds: response.embed ? [translateEmbed(response.embed)] : [],
      flags: response.ephemeral ? 64 : 0,
    },
  };
  logger.debug("[interactions] sending response: ", payload);
  return axios.post(
    `https://discord.com/api/v8/interactions/${event.id}/${event.token}/callback`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
