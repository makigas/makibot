import { APIGuildInteraction } from "discord-api-types";
import InteractionCommand from "../../lib/interaction/basecommand";

interface RaidParameters {
  "raid-mode": boolean;
}

export default class RaidCommand extends InteractionCommand<RaidParameters> {
  name = "raid";

  async handle(params: RaidParameters): Promise<void> {
    await this.client.antiraid.setRaidMode(params["raid-mode"]);
    await this.sendResponse(
      params["raid-mode"] ? "Modo raid activado" : "Modo raid desactivado",
      true
    );
  }
}
