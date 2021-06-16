/* TODO: Rewrite this when Discord.js 13 is out. */

import axios from "axios";
import { Snowflake } from "discord.js";
import Makibot from "../Makibot";
import logger from "./logger";
import Server from "./server";

const interactionsClient = axios.create({
  baseURL: "https://discord.com/api/v8",
  headers: {
    "Content-Type": "application/json",
  },
});

enum ApplicationCommandOptionType {
  SUB_COMMAND = 1,
  SUB_COMMAND_GROUP = 2,
  STRING = 3,
  INTEGER = 4,
  BOOLEAN = 5,
  USER = 6,
  CHANNEL = 7,
  ROLE = 8,
  MENTIONABLE = 9,
}

type OptionType = any;

interface ApplicationCommandInteractionDataOption {
  name: string;
  type: ApplicationCommandOptionType;
  value?: OptionType;
  options?: ApplicationCommandInteractionDataOption[];
}

/** Payload. Not every field is added, only what we care. */
interface InteractionPayload {
  id: Snowflake;
  token: string;
  type: number;
  data: {
    name: string;
    id: Snowflake;
    options?: ApplicationCommandInteractionDataOption[];
  };
  member: {
    user: {
      username: string;
      discriminator: string;
      id: Snowflake;
      public_flags: number;
      avatar: string;
    };
    roles: Snowflake[];
  };
  guild_id: string;
}

function sendResponse(event: InteractionPayload, response: string, ephemeral: boolean = false) {
  const payload: any = {
    type: 4,
    data: { content: response },
  };
  if (ephemeral) {
    payload.data.flags = 64;
  }
  logger.debug("[interactions] sending response: ", payload);
  return interactionsClient.post(`/interactions/${event.id}/${event.token}/callback`, payload);
}

type Handler = (client: Makibot, event: InteractionPayload) => Promise<void>;

const handlers: { [name: string]: Handler } = {
  /* { "name": "karma" } */
  async karma(client, event) {
    const guild = client.guilds.cache.get(event.guild_id);
    const server = new Server(guild);
    const member = await server.member(event.member.user.id);

    const stats = await member.getKarma();

    const kinds = [
      `👍 ${stats.upvotes}`,
      `👎 ${stats.downvotes}`,
      `⭐ ${stats.stars}`,
      `❤️ ${stats.hearts}`,
      `👋 ${stats.waves}`,
    ];
    const response =
      `🪙 Karma: ${stats.points}        🏅 Nivel: ${stats.level}\n` +
      `  💬 Mensajes: ${stats.messages}        ⏩ Offset: ${stats.offset}\n` +
      `  ${kinds.join("    ")}`;
    await sendResponse(event, response, true);
  },
  async raid(client, event) {
    const mode: boolean = event.data.options[0].value as boolean;
    await client.antiraid.setRaidMode(mode);
    await sendResponse(event, mode ? "Modo raid activado" : "Modo raid desactivado", true);
  }
};

function handleApplicationCommand(client: Makibot, event: InteractionPayload) {
  const handler = handlers[event.data.name];
  if (handler) {
    handler(client, event);
  }
}

export function handleInteraction(client: Makibot, event: InteractionPayload) {
  logger.debug("[interactions] received event: ", event);
  switch (event.type) {
    case 2:
      handleApplicationCommand(client, event);
      break;
  }
}
