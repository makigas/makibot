import { Guild, Snowflake } from "discord.js";
import { SettingProvider } from "discord.js-commando";
import Counter, { CounterOptions } from "./counter";
import Tag from "./tag";

export default class TagBag {
  private tags: { [key: string]: Tag };

  private counters: { [key: string]: Counter };

  constructor(
    private provider: SettingProvider,
    private resolvable: Snowflake,
    private guild?: Guild
  ) {
    this.tags = {};
    this.counters = {};
  }

  counter(key: string, options?: CounterOptions): Counter {
    if (this.counters[key]) {
      return this.counters[key];
    }
    if (!options) {
      options = {};
    }
    return (this.counters[key] = new Counter(this.provider, `${this.resolvable}:${key}`, {
      ...options,
      guild: this.guild,
    }));
  }

  tag(key: string): Tag {
    if (this.tags[key]) {
      return this.tags[key];
    }
    return (this.tags[key] = new Tag(this.provider, `${this.resolvable}:${key}`, this.guild));
  }
}
