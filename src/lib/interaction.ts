import {
  APIApplicationCommandInteractionDataOption,
  APIGuildInteraction,
  APIInteraction,
  ApplicationCommandOptionType,
  InteractionType,
} from "discord-api-types/v8";
import { Guild } from "discord.js";
import KarmaCommand from "../interactions/commands/karma";
import PrimoCommand from "../interactions/commands/primo";
import RaidCommand from "../interactions/commands/raid";
import Makibot from "../Makibot";
import InteractionCommand from "./interaction/basecommand";
import logger from "./logger";

interface HandlerConstructor {
  // https://stackoverflow.com/a/39614325/2033517
  new (client: Makibot, event: APIGuildInteraction): InteractionCommand<{}>;
}

/* The different command handlers, maps a command name with the appropiate class. */
const Handlers: { [name: string]: HandlerConstructor } = {
  karma: KarmaCommand,
  primo: PrimoCommand,
  raid: RaidCommand,
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

  for (let option of params) {
    switch (option.type) {
      case ApplicationCommandOptionType.BOOLEAN:
      case ApplicationCommandOptionType.INTEGER:
      case ApplicationCommandOptionType.STRING:
        parsedParams[option.name] = option.value;
        break;

      case ApplicationCommandOptionType.CHANNEL: {
        let channel = guild.channels.cache.get(option.value);
        parsedParams[option.name] = channel;
        break;
      }
      case ApplicationCommandOptionType.USER: {
        let user = await guild.members.fetch(option.value);
        parsedParams[option.name] = user;
      }
      case ApplicationCommandOptionType.ROLE: {
        let role = await guild.roles.fetch(option.value);
        parsedParams[option.name] = role;
      }
      case ApplicationCommandOptionType.MENTIONABLE: {
        try {
          let user = await guild.members.fetch(option.value);
          parsedParams[option.name] = user;
        } catch (e) {
          let role = await guild.roles.fetch(option.value);
          parsedParams[option.name] = role;
        }
      }
    }
  }

  return parsedParams;
}

export async function handleInteraction(client: Makibot, event: APIInteraction) {
  logger.debug("[interactions] received event: ", event);
  if (isThisEventAGuildInteraction(event) && Handlers[event.data.name]) {
    let handler = new Handlers[event.data.name](client, event);
    let guild = await client.guilds.fetch(event.guild_id);
    let parameters = event.data.options ? await convertParameters(event.data.options, guild) : {};
    handler.handle(parameters);
  }
}
