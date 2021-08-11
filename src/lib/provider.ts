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
    this.cache = {
      "global": {},
    };
  }

  async init(): Promise<void> {
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
    if (!this.cache[guildToCacheName(guild)]) {
      
    }
    return this.cache[guildToCacheName(guild)][key] || defaultValue;
  }

  async set(guild: Snowflake | "global", key: string, value: any): Promise<any> {
    this.cache[guildToCacheName(guild)][key] = value;
    const newSettings = JSON.stringify(this.cache[guildToCacheName(guild)]);
    await this.db.run("INSERT OR REPLACE INTO settings(guild, settings) VALUES(?, ?)", [
      guildToDatabaseName(guild),
      newSettings,
    ]);
    return value;
  }

  async remove(guild: Snowflake | "global", key: string): Promise<any> {
    delete this.cache[guildToCacheName(guild)][key];
    const newSettings = JSON.stringify(this.cache[guildToCacheName(guild)]);
    await this.db.run("INSERT OR REPLACE INTO settings(guild, settings) VALUES(?, ?)", [
      guildToDatabaseName(guild),
      newSettings,
    ]);
  }
}
