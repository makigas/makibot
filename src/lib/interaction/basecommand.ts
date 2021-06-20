import axios from "axios";
import { APIGuildInteraction } from "discord-api-types";
import Makibot from "../../Makibot";
import logger from "../logger";

const interactionsClient = axios.create({
  baseURL: "https://discord.com/api/v8",
  headers: {
    "Content-Type": "application/json",
  },
});

export default abstract class InteractionCommand<Params> {
  protected readonly client: Makibot;
  protected readonly event: APIGuildInteraction;

  constructor(client: Makibot, event: APIGuildInteraction) {
    this.client = client;
    this.event = event;
  }

  abstract name: string;
  abstract handle(params?: Params): Promise<void>;

  sendResponse(response: string, ephemeral: boolean = false): Promise<void> {
    const payload: any = {
      type: 4,
      data: { content: response },
    };
    if (ephemeral) {
      payload.data.flags = 64;
    }
    logger.debug("[interactions] sending response: ", payload);
    return interactionsClient.post(
      `/interactions/${this.event.id}/${this.event.token}/callback`,
      payload
    );
  }
}
