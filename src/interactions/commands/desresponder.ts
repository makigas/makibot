import { Guild } from "discord.js";
import Server from "../../lib/server";
import InteractionCommand from "../../lib/interaction/basecommand";
import type { ResponderParams } from "./responder";
import { deleteGuildCommand, getGuildCommand } from "../../lib/interaction/client";

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
        await this.sendResponse("Comando ha sido eliminado", true);
      } else {
        /* The command is not found, but we delete it from the array. */
        await this.sendResponse("Comando ha sido retirado", true);
      }
      delete currentCommands[params.nombre];
      await replyCommands.set(currentCommands);
    } else {
      await this.sendResponse("Este comando no existe", true);
    }
  }
}
