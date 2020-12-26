import { Guild } from "discord.js";
import { SettingProvider } from "discord.js-commando";

/**
 * Additional options to be used when creating a tag.
 */
export interface TagOptions {
  /** If provided, the guild that the tag will be bound to. */
  guild?: Guild;

  /** If provided, the TTL the tag has. */
  ttl?: number;
}

export default class Tag {
  private readonly provider: SettingProvider;

  private readonly guildId: string;

  private readonly key: string;

  private readonly ttl: number | null;

  constructor(provider: SettingProvider, key: string, options?: TagOptions) {
    this.provider = provider;
    this.key = key;
    this.guildId = options?.guild?.id || "global";
    this.ttl = options?.ttl || null;
  }

  get<T>(defVal?: T): T {
    if (this.isExpired) {
      return defVal;
    }
    return this.provider.get(this.guildId, this.key, defVal);
  }

  async set<T>(value: T): Promise<T> {
    if (this.isExpirable) {
      await this.provider.set(this.guildId, this.expireKey, Date.now());
    }
    return this.provider.set(this.guildId, this.key, value);
  }

  async delete(): Promise<void> {
    if (this.isExpirable) {
      await this.provider.remove(this.guildId, this.expireKey);
    }
    await this.provider.remove(this.guildId, this.key);
  }

  private get isExpirable(): boolean {
    return !!this.ttl;
  }

  private get expireKey(): string {
    return `${this.key}::updatedAt`;
  }

  private get isExpired(): boolean {
    if (!this.isExpirable) {
      return false;
    }
    const lastUpdateAt = this.provider.get(this.guildId, this.expireKey, 0);
    return Date.now() - lastUpdateAt > this.ttl * 1000;
  }
}
