import {
  APIApplicationCommandInteractionDataOption,
  APIApplicationCommandInteraction,
  APIGuildInteraction,
  APIInteraction,
  ApplicationCommandInteractionDataOptionChannel,
  ApplicationCommandInteractionDataOptionMentionable,
  ApplicationCommandInteractionDataOptionRole,
  ApplicationCommandInteractionDataOptionUser,
  ApplicationCommandOptionType,
  InteractionType,
} from "discord-api-types/v9";
import { Guild } from "discord.js";
import WarnCommand from "../interactions/commands/warn";
import KarmaCommand from "../interactions/commands/karma";
import PrimoCommand from "../interactions/commands/primo";
import RaidCommand from "../interactions/commands/raid";
import DesresponderCommand from "../interactions/commands/desresponder";
import ResponderCommand from "../interactions/commands/responder";
import PropinaCommand from "../interactions/commands/propina";
import Makibot from "../Makibot";
import InteractionCommand from "./interaction/basecommand";
import logger from "./logger";
import Server from "./server";
import { sendResponse } from "./interaction/response";
import { createToast } from "./response";

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
  propina: PropinaCommand,
  desresponder: DesresponderCommand,
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
        break;
      }
      case ApplicationCommandOptionType.Role: {
        const role = await guild.roles.fetch(option.value);
        parsedParams[option.name] = role;
        break;
      }
      case ApplicationCommandOptionType.Mentionable: {
        try {
          const user = await guild.members.fetch(option.value);
          parsedParams[option.name] = user;
        } catch (e) {
          const role = await guild.roles.fetch(option.value);
          parsedParams[option.name] = role;
        }
        break;
      }
    }
  }

  return parsedParams;
}

function eventIsSlashCommand(event: APIInteraction): event is APIApplicationCommandInteraction {
  return event.type === InteractionType.ApplicationCommand;
}

function interpolate(string: string, name: string, value: string): string {
  const interpolation = `%${name}%`;
  const regexp = new RegExp(interpolation, "g");
  return string.replace(regexp, value);
}

export async function handleInteraction(client: Makibot, event: APIInteraction): Promise<void> {
  logger.debug("[interactions] received event: ", event);
  if (isThisEventAGuildInteraction(event) && eventIsSlashCommand(event)) {
    const guild = await client.guilds.fetch(event.guild_id);
    const server = new Server(guild);
    const replies = server.tagbag.tag("reply").get({});

    if (Handlers[event.data.name]) {
      /* Run the interaction command for this. */
      const handler = new Handlers[event.data.name](client, event);
      const parameters = event.data.options
        ? await convertParameters(event.data.options, guild)
        : {};

      handler.handle(guild, parameters).catch((e) => {
        logger.error("[interactions] command failed with a generic error", event.data, e);
        return handler.sendResponse({
          embed: createToast({
            title: "API Error: el comando ha fallado",
            description: "Un administrador encontrará más información en los logs de la aplicación",
            severity: "error",
          }),
        });
      });
    } else if (replies[event.data.name]) {
      /* A local command with this name exists, so send the response. */
      const data = replies[event.data.name];
      console.log(event.data);
      const options = event.data.options || [];
      const params = await convertParameters(options, guild);

      /*
       * Fill interpolations in the template text. They have the format
       * %var%, asking to be replaced by the option given as [var]. The
       * interpolation is resolved as:
       *
       * - For a channel, the name of the channel.
       * - For an user, a role or a mentionable, an at-mention.
       * - For a mentionable, the snowflake (doesn't make sense BUT
       *   what the heck is a mentionable anyway?)
       * - For anything else, converts to string.
       */
      const interpolatedResponse = options.reduce((response, option) => {
        switch (option.type) {
          case ApplicationCommandOptionType.Channel: {
            const channelOption = option as ApplicationCommandInteractionDataOptionChannel;
            return interpolate(response, option.name, `<#${channelOption.value}>`);
          }
          case ApplicationCommandOptionType.User: {
            const userOption = option as ApplicationCommandInteractionDataOptionUser;
            return interpolate(response, option.name, `<@${userOption.value}>`);
          }
          case ApplicationCommandOptionType.Role: {
            const roleOption = option as ApplicationCommandInteractionDataOptionRole;
            return interpolate(response, option.name, `<&${roleOption.value}>`);
          }
          case ApplicationCommandOptionType.Mentionable: {
            const mentionable = option as ApplicationCommandInteractionDataOptionMentionable;
            return interpolate(response, option.name, mentionable.value);
          }
          default:
            return interpolate(response, option.name, params[option.name]);
        }
      }, data.respuesta);

      await sendResponse(event, {
        content: interpolatedResponse,
      });
    }
  }
}
