import { Guild } from "discord.js";
import Makibot from "../Makibot";
import Tag from "./tag";

type SettingsJSONSchema = {
  pin: {
    emoji: string;
    pinboard: string;
  };
};

export default class Settings {
  private readonly client: Makibot;

  private readonly tags: { [tag: string]: Tag };

  public constructor(private guild: Guild) {
    this.client = guild.client as Makibot;
    this.tags = {
      pinEmoji: new Tag(this.client.provider, "Pin.Emoji", guild),
      pinChannel: new Tag(this.client.provider, "Pin.Pinboard", guild),
    };
  }

  public toJSON(): SettingsJSONSchema {
    return {
      pin: {
        emoji: this.pinEmoji,
        pinboard: this.pinPinboard,
      },
    };
  }

  get pinEmoji(): string {
    return this.tags.pinEmoji.get("\u2b50");
  }

  async setPinEmoji(emoji: string): Promise<void> {
    await this.tags.pinEmoji.set(emoji);
  }

  get pinPinboard(): string {
    return this.tags.pinChannel.get();
  }

  async setPinPinboard(pinboard: string): Promise<void> {
    await this.tags.pinChannel.set(pinboard);
  }
}
