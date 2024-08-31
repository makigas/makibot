import { Snowflake } from "discord.js";

export interface SettingProvider {
  init(): Promise<void>;
  get<T>(guild: Snowflake | "global", key: string, defaultValue?: T): T;
  set<T>(guild: Snowflake | "global", key: string, value: T): Promise<T>;
  remove(guild: Snowflake | "global", key: string): Promise<void>;
}
