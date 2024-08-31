/*
 * This is a new implementation for the settings schema. It stores each
 * database entry as a separate entry in an SQLite schema. In the future,
 * a new driver may use a different key-value provider as a backend, such
 * as Redict.
 *
 * There are still some legacy issues, such as the provider still requiring
 * to load in memory the entire table on application startup, in order to
 * keep the get() method to be sync, but as soon as it changes to something
 * async, it will be refactored into a database access.
 */

import { Snowflake } from "discord.js";
import { SettingProvider } from "./provider";
import { Database } from "sqlite";
import logger from "../logger";

const DB_SCHEMA = `
  CREATE TABLE IF NOT EXISTS bot_settings (
    guild INTEGER,
    key VARCHAR(256),
    value TEXT,
    PRIMARY KEY (guild, key)
  );
`;

const LOAD_STMT = `SELECT CAST(guild as TEXT) as guild, key, value FROM bot_settings`;

const UPDATE_STMT = `INSERT OR REPLACE INTO bot_settings(guild, key, value) VALUES(?, ?, ?)`;

const DELETE_STMT = `DELETE FROM bot_settings WHERE guild = ? AND key = ?`;

function guildToDatabaseName(guild: string): string {
  return !guild || guild === "global" || guild === "0" ? "0" : guild;
}

function guildToCacheName(guild: string): string {
  return !guild || guild === "0" || guild === "global" ? "global" : guild;
}

export class SqliteSettingProvider implements SettingProvider {
  private cache: { [server: string]: object } = {};

  constructor(private readonly database: Database) {}

  async init(): Promise<void> {
    await this.database.exec("BEGIN TRANSACTION");
    await this.database.run(DB_SCHEMA);
    await this.database.each(LOAD_STMT, (err, data) => {
      if (err) {
        throw err;
      } else if (data) {
        const { guild, key, value } = data;
        const guildKey = guildToCacheName(guild);
        this.cache[guildKey] ||= {};
        this.cache[guildKey][key] = JSON.parse(value);
      }
    });
    await this.database.exec("COMMIT");
  }

  get<T>(guild: Snowflake | "global", key: string, defaultValue: T = undefined): T {
    logger.trace(`[sqlite] reading key ${guild} / ${key}`);
    const settings = this.cache[guildToCacheName(guild)];
    return settings && settings[key] ? settings[key] : defaultValue;
  }

  async set<T>(guild: Snowflake | "global", key: string, value: T): Promise<T> {
    logger.trace(`[sqlite] setting key ${guild} / ${key} = ${JSON.stringify(value)}`);
    const guildKey = guildToCacheName(guild);
    this.cache[guildKey] ||= {};
    this.cache[guildKey][key] = value;

    const serialValue = JSON.stringify(value);
    await this.database.exec("BEGIN TRANSACTION");
    await this.database.run(UPDATE_STMT, [guildToDatabaseName(guild), key, serialValue]);
    await this.database.exec("COMMIT");
    return value;
  }

  async remove(guild: Snowflake | "global", key: string): Promise<void> {
    logger.trace(`[sqlite] removing key ${guild} / ${key}`);
    const guildKey = guildToCacheName(guild);
    this.cache[guildKey] ||= {};
    delete this.cache[guildKey][key];

    await this.database.exec("BEGIN TRANSACTION");
    await this.database.run(DELETE_STMT, [guildToDatabaseName(guild), key]);
    await this.database.exec("COMMIT");
  }
}
