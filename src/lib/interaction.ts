import {
  APIApplicationCommandInteractionDataOption,
  APIApplicationCommandInteraction,
  APIGuildInteraction,
  APIInteraction,
  ApplicationCommandOptionType,
  InteractionType,
} from "discord-api-types/v9";
import { Guild } from "discord.js";
import WarnCommand from "../interactions/commands/warn";
import KarmaCommand from "../interactions/commands/karma";
import PrimoCommand from "../interactions/commands/primo";
import RaidCommand from "../interactions/commands/raid";
import ResponderCommand, { ResponderActionInteraction } from "../interactions/commands/responder";
import Makibot from "../Makibot";
import InteractionCommand from "./interaction/basecommand";
import logger from "./logger";
import Server from "./server";

interface HandlerConstructor {
  // https://stackoverflow.com/a/39614325/2033517
  new (client: Makibot, event: APIGuildInteraction): InteractionCommand<{}>;
}

/* The different command handlers, maps a command name with the appropiate class. */
const Handlers: { [name: string]: HandlerConstructor } = {
  karma: KarmaCommand,
  primo: PrimoCommand,
  raid: RaidCommand,
  warn: WarnCommand,
  responder: ResponderCommand,
};

function isThisEventAGuildInteraction(event: APIInteraction): event is APIGuildInteraction {
  return event.type == InteractionType.ApplicationCommand;
}

/*
 * I'm sorry to do this, I'm so sorry for writing this code. But Discord API
 * yields each parameter inside an object, where there is a type discriminator
 * to set the real type of "value".
 *
 * Besides, some types are snowflakes that must be resolved.
 */
async function convertParameters(
  params: APIApplicationCommandInteractionDataOption[],
  guild: Guild
): Promise<object> {
  /* Too scared to do it with a reduce, because there are asyncs. */
  const parsedParams = {};

  for (const option of params) {
    switch (option.type) {
      case ApplicationCommandOptionType.Boolean:
      case ApplicationCommandOptionType.Integer:
      case ApplicationCommandOptionType.String:
        parsedParams[option.name] = option.value;
        break;

      case ApplicationCommandOptionType.Channel: {
        const channel = guild.channels.cache.get(option.value);
        parsedParams[option.name] = channel;
        break;
      }
      case ApplicationCommandOptionType.User: {
        const user = await guild.members.fetch(option.value);
        parsedParams[option.name] = user;
      }
      case ApplicationCommandOptionType.Role: {
        const role = await guild.roles.fetch(option.value);
        parsedParams[option.name] = role;
      }
      case ApplicationCommandOptionType.Mentionable: {
        try {
          const user = await guild.members.fetch(option.value);
          parsedParams[option.name] = user;
        } catch (e) {
          const role = await guild.roles.fetch(option.value);
          parsedParams[option.name] = role;
        }
      }
    }
  }

  return parsedParams;
}

function eventIsSlashCommand(event: APIInteraction): event is APIApplicationCommandInteraction {
  return event.type === InteractionType.ApplicationCommand;
}

export async function handleInteraction(client: Makibot, event: APIInteraction) {
  logger.debug("[interactions] received event: ", event);
  if (isThisEventAGuildInteraction(event) && eventIsSlashCommand(event)) {
    let guild = await client.guilds.fetch(event.guild_id);
    let server = new Server(guild);
    let replies = server.tagbag.tag("reply").get({});

    if (Handlers[event.data.name]) {
      /* Run the interaction command for this. */
      let handler = new Handlers[event.data.name](client, event);
      let parameters = event.data.options ? await convertParameters(event.data.options, guild) : {};
      handler.handle(guild, parameters);
    } else if (replies[event.data.name]) {
      /* A local command with this name exists, so send the response. */
      let data = replies[event.data.name];
      let command = new ResponderActionInteraction(client, event);
      command.handle(guild, data);
    }
  }
}
