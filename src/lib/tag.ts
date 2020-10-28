import { Guild } from "discord.js";
import { SettingProvider } from "discord.js-commando";

export default class Tag {
  private readonly provider: SettingProvider;

  private readonly guildId: string;

  private readonly key: string;

  constructor(provider: SettingProvider, key: string, guild?: Guild) {
    this.provider = provider;
    this.key = key;
    this.guildId = guild?.id || "global";
  }

  get<T>(defVal?: T): T {
    return this.provider.get(this.guildId, this.key, defVal);
  }

  set<T>(value: T): Promise<T> {
    return this.provider.set(this.guildId, this.key, value);
  }

  delete(): Promise<void> {
    return this.provider.remove(this.guildId, this.key);
  }
}
