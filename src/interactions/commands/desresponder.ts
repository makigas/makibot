import axios from "axios";
import { Guild, Snowflake } from "discord.js";
import Server from "../../lib/server";
import InteractionCommand from "../../lib/interaction/basecommand";
import type { ResponderParams } from "./responder";

interface DesresponderParams {
  nombre: string;
}

async function getCommandId(
  app: Snowflake,
  guild: Snowflake,
  name: string
): Promise<Snowflake | null> {
  const request = await axios.get(
    `https://discord.com/api/v8/applications/${app}/guilds/${guild}/commands`,
    { headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` } }
  );
  const command = request.data.find((command: { name: string }) => command.name === name);
  return command ? command.id : null;
}

async function deleteCommand(app: Snowflake, guild: Snowflake, command: Snowflake): Promise<void> {
  await axios.delete(
    `https://discord.com/api/v8/applications/${app}/guilds/${guild}/commands/${command}`,
    { headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` } }
  );
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
      const app = await this.client.fetchApplication();
      const commandId = await getCommandId(app.id, guild.id, params.nombre);
      if (commandId) {
        await deleteCommand(app.id, guild.id, commandId);
      }
      delete currentCommands[params.nombre];
      await replyCommands.set(currentCommands);
      await this.sendResponse("Comando ha sido eliminado", true);
    } else {
      await this.sendResponse("Este comando no existe", true);
    }
  }
}
