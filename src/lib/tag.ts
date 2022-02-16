import { Guild } from "discord.js";
import { SettingProvider } from "../../src/lib/provider";

export type TtlStrategy = "NONE" | "TOUCH_FIRST" | "TOUCH_ALWAYS";

/**
 * Additional options to be used when creating a tag.
 */
export interface TagOptions {
  /** If provided, the guild that the tag will be bound to. */
  guild?: Guild;

  /** If provided, the TTL the tag has. */
  ttl?: number;

  /** If provided, the TTL strategy to use with this tag. */
  ttlStrategy?: TtlStrategy;
}

export default class Tag {
  private readonly provider: SettingProvider;

  private readonly guildId: string;

  private readonly key: string;

  private readonly ttl: number | null;

  private readonly ttlStrategy: TtlStrategy;

  constructor(provider: SettingProvider, key: string, options?: TagOptions) {
    this.provider = provider;
    this.key = key;
    this.guildId = options?.guild?.id || "global";
    if (options && options.ttl) {
      this.ttl = options.ttl;
      this.ttlStrategy = options.ttlStrategy;
    } else {
      this.ttl = null;
      this.ttlStrategy = "NONE";
    }
  }

  get<T>(defVal?: T): Promise<T> {
    if (this.isExpired) {
      return Promise.resolve(defVal);
    }
    return Promise.resolve(this.provider.get(this.guildId, this.key, defVal));
  }

  async set<T>(value: T): Promise<T> {
    if (
      this.ttlStrategy == "TOUCH_ALWAYS" ||
      (this.ttlStrategy == "TOUCH_FIRST" && this.isExpired)
    ) {
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
    return this.ttlStrategy != "NONE";
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
