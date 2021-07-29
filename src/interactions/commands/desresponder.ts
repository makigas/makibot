import { Guild } from "discord.js";
import Server from "../../lib/server";
import InteractionCommand from "../../lib/interaction/basecommand";
import type { ResponderParams } from "./responder";
import { deleteGuildCommand, getGuildCommand } from "../../lib/interaction/client";
import { createToast } from "../../lib/response";

interface DesresponderParams {
  nombre: string;
}

/*
{
  "name": "desresponder",
  "description": "Elimina un comando previamente creado con responder",
  "options": [
    {
      "type": 3,
      "name": "nombre",
      "description": "El comando que eliminamos",
      "required": true
    }
  ]
}
*/
export default class DesresponderCommand extends InteractionCommand<DesresponderParams> {
  name = "desresponder";

  async handle(guild: Guild, params?: DesresponderParams): Promise<void> {
    const server = new Server(guild);
    const replyCommands = server.tagbag.tag("reply");
    const currentCommands: { [name: string]: ResponderParams } = replyCommands.get({});

    if (params && params.nombre in currentCommands) {
      const command = await getGuildCommand(guild, params.nombre);
      if (command) {
        /* The command is found, ready to delete it. */
        deleteGuildCommand(guild, command.id);
        const toast = createToast({
          title: "El comando ha sido eliminado con éxito",
          severity: "success",
        });
        await this.sendResponse({ embed: toast, ephemeral: true });
      } else {
        /* Use a different message to signal the error to clever users. */
        const toast = createToast({
          title: "El comando ha sido eliminado del sistema del bot",
          severity: "success",
        });
        await this.sendResponse({ embed: toast, ephemeral: true });
      }
      delete currentCommands[params.nombre];
      await replyCommands.set(currentCommands);
    } else {
      const toast = createToast({
        title: "Comando no encontrado",
        severity: "error",
      });
      await this.sendResponse({ embed: toast, ephemeral: true });
    }
  }
}
