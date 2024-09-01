import { Guild, Snowflake } from "discord.js";
import { SettingProvider } from "../../src/lib/provider";
import Tag from "./tag";

export default class TagBag {
  constructor(
    private provider: SettingProvider,
    private resolvable: Snowflake,
    private guild?: Guild,
  ) {}

  tag(key: string): Tag {
    return new Tag(this.provider, `${this.resolvable}:${key}`, this.guild);
  }
}
