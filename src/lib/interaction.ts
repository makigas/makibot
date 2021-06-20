/* TODO: Rewrite this when Discord.js 13 is out. */

import axios from "axios";
import { APIApplicationCommandInteraction, APIGuildInteraction, APIInteraction, ApplicationCommandOptionType, InteractionType } from "discord-api-types/v8";
import Makibot from "../Makibot";
import logger from "./logger";
import Server from "./server";

const interactionsClient = axios.create({
  baseURL: "https://discord.com/api/v8",
  headers: {
    "Content-Type": "application/json",
  },
});

function sendResponse(
  event: APIInteraction,
  response: string,
  ephemeral: boolean = false,
): Promise<void> {
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

type Handler = (client: Makibot, event: APIGuildInteraction) => Promise<void>;

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
    let mode: boolean;
    if (event.data.options[0].type == ApplicationCommandOptionType.BOOLEAN) {
      mode = event.data.options[0].value;
      await client.antiraid.setRaidMode(mode);
      await sendResponse(event, mode ? "Modo raid activado" : "Modo raid desactivado", true);
    }
  },
};

function handleApplicationCommand(client: Makibot, event: APIGuildInteraction) {
  const handler = handlers[event.data.name];
  if (handler) {
    handler(client, event);
  }
}

function isThisEventAGuildInteraction(event: APIInteraction): event is APIGuildInteraction {
  return event.type == InteractionType.ApplicationCommand;
}

export function handleInteraction(client: Makibot, event: APIInteraction) {
  logger.debug("[interactions] received event: ", event);
  if (isThisEventAGuildInteraction(event)) {
    handleApplicationCommand(client, event);
  }
}
