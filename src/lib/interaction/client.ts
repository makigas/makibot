import axios from "axios";
import {
  APIApplicationCommand,
  APIApplicationCommandOption,
  RESTGetAPIApplicationGuildCommandsResult,
  RESTPostAPIApplicationGuildCommandsJSONBody,
} from "discord-api-types/v9";
import { Guild, Snowflake } from "discord.js";

const client = axios.create({
  baseURL: "https://discord.com/api/v8/",
  headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
});

/**
 * Creates a local command bound to a specific guild.
 * @param guild the guild where the command will be bound to
 * @param name the name of the command that will be created
 * @param options the options array for the local command
 * @returns a promise that resolves unless there is an error
 */
export async function createGuildCommand(
  guild: Guild,
  name: string,
  options: APIApplicationCommandOption[]
): Promise<void> {
  const application = await guild.client.fetchApplication();
  const url = `/applications/${application.id}/guilds/${guild.id}/commands`;
  const payload: RESTPostAPIApplicationGuildCommandsJSONBody = {
    name,
    description: `Ejecuta el comando ${name} en este servidor`,
    options,
  };
  await client.post(url, payload);
}

/**
 * Fetches a command given its name.
 * @param guild the guild there the local command exists
 * @param name the name of the command that will be retrieved
 * @returns a promise that resolves to the command behind this name
 */
export async function getGuildCommand(guild: Guild, name: string): Promise<APIApplicationCommand> {
  const application = await guild.client.fetchApplication();
  const url = `/v8/applications/${application.id}/guilds/${guild.id}/commands`;
  return client
    .get<RESTGetAPIApplicationGuildCommandsResult>(url)
    .then((resp) => resp.data.find((cmd) => cmd.name === name));
}

/**
 * Deletes a local command given its identifier.
 * @param guild the guild where the local command exists.
 * @param id the identifier of the command to delete.
 */
export async function deleteGuildCommand(guild: Guild, id: Snowflake): Promise<void> {
  const application = await guild.client.fetchApplication();
  const url = `/v8/applications/${application.id}/guilds/${guild.id}/commands/${id}`;
  await client.delete(url);
}
