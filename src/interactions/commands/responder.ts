import { Guild, Snowflake } from "discord.js";
import Server from "../../lib/server";
import InteractionCommand from "../../lib/interaction/basecommand";
import axios from "axios";

interface ResponderParams {
  nombre: string;
  efimero: boolean;
  respuesta: string;
}

/**
 * A fake command just so that I can use the sendResponse.
 */
export class ResponderActionInteraction extends InteractionCommand<ResponderParams> {
  name = null;

  async handle(_guild: Guild, params?: ResponderParams): Promise<void> {
    await this.sendResponse(params.respuesta, params.efimero);
  }
}

async function registerReply(app: Snowflake, guild: Snowflake, name: string): Promise<void> {
  await axios.post(
    `https://discord.com/api/v8/applications/${app}/guilds/${guild}/commands`,
    {
      name,
      description: `Ejecuta comando ${name}`,
      options: [],
    },
    {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
    }
  );
}

/*
{
  "name": "responder",
  "description": "Crea comandos locales que responden con frases",
  "options": [
    {
      "type": 3,
      "name": "nombre",
      "description": "Cómo llamamos al comando",
      "required": true
    },
    {
      "type": 5,
      "name": "efimero",
      "description": "Lo hacemos que lo vea sólo quien lo manda o todo el mundo",
      "required": true
    },
    {
      "type": 3,
      "name": "respuesta",
      "description": "Qué quieres que diga el bot cuando se mande este comando",
      "required": true
    }
  ]
}
*/
export default class ResponderCommand extends InteractionCommand<ResponderParams> {
  name: string = "responder";

  async handle(guild: Guild, params?: ResponderParams): Promise<void> {
    const server = new Server(guild);
    const replyCommands = server.tagbag.tag("reply");
    const currentCommands: { [name: string]: ResponderParams } = replyCommands.get({});

    if (currentCommands[params.nombre]) {
      await this.sendResponse(
        "Este comando ya está creado, bórralo antes o dale otro nombre",
        true
      );
      return;
    }

    currentCommands[params.nombre] = params;

    /* Fetch the APP_ID for this bot. */
    const application = await this.client.fetchApplication();
    const applicationId = application.id;
    await registerReply(applicationId, guild.id, params.nombre);

    /* Register the command. */
    replyCommands.set(currentCommands);

    this.sendResponse(`vale`, true);
  }
}
