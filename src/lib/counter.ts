import { Guild } from "discord.js";
import { SettingProvider } from "../../src/lib/provider";
import Tag, { TtlStrategy } from "./tag";

export interface CounterOptions {
  min?: number;

  max?: number;

  initial?: number;

  guild?: Guild;

  ttl?: number;

  ttlStrategy?: TtlStrategy;
}

/**
 * A Counter is a wrapper around Tags (which are already wrappers around
 * Commando's SettingProvider) to coerce the value set to a tag to a number
 * clamped in a range. There are additional helper methods to quickly increment
 * and decrement the value of the tag.
 */
export default class Counter {
  private wrappedTag: Tag;

  private options: CounterOptions;

  constructor(provider: SettingProvider, key: string, options?: CounterOptions) {
    this.wrappedTag = new Tag(provider, key, {
      guild: options?.guild,
      ttl: options?.ttl,
      ttlStrategy: options?.ttlStrategy,
    });
    this.options = options || {};
  }

  /**
   * Gets the current value of the counter. If the key is not set, it returns
   * the initial value given when instantiating the counter.
   */
  get(): number {
    return this.wrappedTag.get(this.options.initial || 0);
  }

  /**
   * Clamps and sets the counter to the given value.
   * @param n the value to be set in the counter
   * @returns the value set, once clamped
   */
  set(n: number): Promise<number> {
    return this.wrappedTag.set(this.clamp(n as number));
  }

  /**
   * Increments and clamps the counter value
   * @returns the value that has been set
   */
  inc(): Promise<number> {
    return this.set(this.get() + 1);
  }

  /**
   * Decrements and clamps the counter value
   * @returns the value that has been set
   */
  dec(): Promise<number> {
    return this.set(this.get() - 1);
  }

  /**
   * Deletes the counter from the SettingProvider.
   */
  delete(): Promise<void> {
    return this.wrappedTag.delete();
  }

  private clamp(n: number): number {
    if (!this.options) {
      return n;
    }
    if (this.options.min && n < this.options.min) {
      return this.options.min;
    } else if (this.options.max && n > this.options.max) {
      return this.options.max;
    } else {
      return n;
    }
  }
}
