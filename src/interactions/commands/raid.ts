import { APIGuildInteraction } from "discord-api-types";
import InteractionCommand from "../../lib/interaction/basecommand";

interface RaidParameters {
  "raid-mode": boolean;
}

/*
{
  "name": "raid",
  "description": "Apaga o enciende la verificación por captcha",
  "options": [
    {
      "type": 5,
      "name": "raid-mode",
      "description": "true para activar modo raid, false en caso contrario",
      "required": true
    }
  ],
  "default_permission": false
}

{
  "permissions": [
    {
      "id": "<mod>",
      "type": 1,
      "permission": true
    }
  ]
}
*/
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
