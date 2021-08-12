import { Client, Snowflake } from "discord.js";
import { Database } from "sqlite";

function guildToDatabaseName(guild: string): string {
  return !guild || guild === "global" || guild === "0" ? "0" : guild;
}

function guildToCacheName(guild: string): string {
  return !guild || guild === "0" || guild === "global" ? "global" : guild;
}

export class SettingProvider {
  private cache: { [server: string]: object };

  constructor(private db: Database, private client: Client) {
    this.cache = {};
  }

  async init(): Promise<void> {
    await this.db.run(
      "CREATE TABLE IF NOT EXISTS settings (guild INTEGER PRIMARY KEY, settings TEXT)"
    );
    await this.db.each(
      "SELECT CAST(guild as TEXT) as guild, settings FROM settings",
      (err, data) => {
        if (data) {
          const { guild, settings } = data;
          this.cache[guildToCacheName(guild)] = JSON.parse(settings);
        }
      }
    );
  }

  get(guild: Snowflake | "global", key: string, defaultValue: any = undefined): any {
    const settings = this.cache[guildToCacheName(guild)];
    return settings && settings[key] ? settings[key] : defaultValue;
  }

  async set(guild: Snowflake | "global", key: string, value: any): Promise<any> {
    const guildKey = guildToCacheName(guild);
    this.cache[guildKey] ||= {};
    this.cache[guildKey][key] = value;
    const newSettings = JSON.stringify(this.cache[guildKey]);
    await this.db.run("INSERT OR REPLACE INTO settings(guild, settings) VALUES(?, ?)", [
      guildToDatabaseName(guild),
      newSettings,
    ]);
    return value;
  }

  async remove(guild: Snowflake | "global", key: string): Promise<any> {
    const guildKey = guildToCacheName(guild);
    this.cache[guildKey] ||= {};
    delete this.cache[guildKey][key];
    const newSettings = JSON.stringify(this.cache[guildToCacheName(guild)]);
    await this.db.run("INSERT OR REPLACE INTO settings(guild, settings) VALUES(?, ?)", [
      guildToDatabaseName(guild),
      newSettings,
    ]);
  }
}
