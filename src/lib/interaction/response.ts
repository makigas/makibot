import axios from "axios";
import { APIGuildInteraction, APIInteractionResponse } from "discord-api-types";
import logger from "../logger";

export async function sendResponse(
  event: APIGuildInteraction,
  response: string,
  ephemeral = false
): Promise<void> {
  const payload: APIInteractionResponse = {
    type: 4,
    data: { content: response },
  };
  if (ephemeral) {
    payload.data.flags = 64;
  }
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
