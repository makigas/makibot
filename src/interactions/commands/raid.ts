import { Guild } from "discord.js";
import InteractionCommand from "../../lib/interaction/basecommand";
import { createToast } from "../../lib/response";

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

  async handle(_guild: Guild, params: RaidParameters): Promise<void> {
    await this.client.antiraid.setRaidMode(params["raid-mode"]);
    const toast = createToast({
      title: `El modo raid ha sido ${params["raid-mode"] ? "activado" : "desactivado"}`,
      severity: "info",
    });
    await this.sendResponse({ embed: toast, ephemeral: true });
  }
}
