import { Guild, Snowflake } from "discord.js";
import Server from "../../lib/server";
import InteractionCommand from "../../lib/interaction/basecommand";
import axios from "axios";
import { APIApplicationCommandOption, ApplicationCommandOptionType } from "discord-api-types";

const commandParamType: { [kind: string]: ApplicationCommandOptionType } = {
  string: ApplicationCommandOptionType.String,
  integer: ApplicationCommandOptionType.Integer,
  boolean: ApplicationCommandOptionType.Boolean,
  role: ApplicationCommandOptionType.Role,
  mentionable: ApplicationCommandOptionType.Mentionable,
  user: ApplicationCommandOptionType.User,
  channel: ApplicationCommandOptionType.Channel,
};

export function parseCommandArguments(input: string): APIApplicationCommandOption[] {
  if (!input) {
    return [];
  }

  /* Trim whitespaces. */
  const parsedParameters = input.trim().split(/\s+/);
  return parsedParameters.map((param) => {
    const splitParams = param.split(":");
    if (splitParams.length != 2) {
      throw new Error("This parameter is not declared correctly: " + param);
    }
    const [name, type] = splitParams;
    if (!commandParamType[type]) {
      throw new Error("Invalid data type: " + type);
    }
    return {
      name,
      description: name,
      type: commandParamType[type],
    };
  });
}

interface ResponderParams {
  nombre: string;
  efimero: boolean;
  respuesta: string;
  params: string;
}

async function registerReply(
  app: Snowflake,
  guild: Snowflake,
  name: string,
  commandParams: APIApplicationCommandOption[]
): Promise<void> {
  await axios.post(
    `https://discord.com/api/v8/applications/${app}/guilds/${guild}/commands`,
    {
      name,
      description: `Ejecuta comando ${name}`,
      options: commandParams || [],
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
    },
    {
      "type": 3,
      "name": "params",
      "description": "Especificación de los parámetros que aceptará este comando",
      "required": false,
    }
  ]
}
*/
export default class ResponderCommand extends InteractionCommand<ResponderParams> {
  name = "responder";

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
    const commandParams = parseCommandArguments(params.params);
    await registerReply(applicationId, guild.id, params.nombre, commandParams);

    /* Register the command. */
    replyCommands.set(currentCommands);

    this.sendResponse(`vale`, true);
  }
}
