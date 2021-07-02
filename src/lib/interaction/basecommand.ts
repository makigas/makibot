import { APIGuildInteraction } from "discord-api-types";
import { Guild } from "discord.js";
import Makibot from "../../Makibot";
import { sendResponse } from "./response";

export default abstract class InteractionCommand<Params> {
  protected readonly client: Makibot;
  protected readonly event: APIGuildInteraction;

  constructor(client: Makibot, event: APIGuildInteraction) {
    this.client = client;
    this.event = event;
  }

  abstract name: string;
  abstract handle(guild: Guild, params?: Params): Promise<void>;

  sendResponse(response: string, ephemeral = false): Promise<void> {
    return sendResponse(this.event, response, ephemeral);
  }
}
