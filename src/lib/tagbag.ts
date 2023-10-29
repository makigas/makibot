import { Guild, Snowflake } from "discord.js";
import { SettingProvider } from "../../src/lib/provider";
import Tag from "./tag";

export default class TagBag {
  private tags: { [key: string]: Tag };

  constructor(
    private provider: SettingProvider,
    private resolvable: Snowflake,
    private guild?: Guild,
  ) {
    this.tags = {};
  }

  tag(key: string): Tag {
    if (this.tags[key]) {
      return this.tags[key];
    }
    return (this.tags[key] = new Tag(this.provider, `${this.resolvable}:${key}`, {
      guild: this.guild,
    }));
  }
}
