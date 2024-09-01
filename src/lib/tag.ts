import { Guild } from "discord.js";
import { SettingProvider } from "../../src/lib/provider";

export default class Tag {
  private readonly provider: SettingProvider;

  private readonly guildId: string;

  private readonly key: string;

  constructor(provider: SettingProvider, key: string, guild?: Guild) {
    this.provider = provider;
    this.key = key;
    this.guildId = guild?.id || "global";
  }

  get<T>(): Promise<T | undefined>;
  get<T>(defVal: T): Promise<T>;
  get<T>(defVal?: T): Promise<T | undefined> {
    return Promise.resolve(this.provider.get(this.guildId, this.key, defVal));
  }

  async set<T>(value: T): Promise<T> {
    return this.provider.set(this.guildId, this.key, value);
  }

  async delete(): Promise<void> {
    await this.provider.remove(this.guildId, this.key);
  }
}
