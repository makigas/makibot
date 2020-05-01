import { Guild } from "discord.js";
import Makibot from "../Makibot";

export default class Settings {
  private readonly client: Makibot;

  public constructor(private guild: Guild) {
    this.client = guild.client as Makibot;
  }

  get pinEmoji(): string {
    return this.client.provider.get(this.guild, "Pin.Emoji", "\u2b50");
  }

  setPinEmoji(emoji: string): Promise<void> {
    return this.client.provider.set(this.guild, "Pin.Emoji", emoji);
  }

  get pinPinboard(): string {
    return this.client.provider.get(this.guild, "Pin.Pinboard", null);
  }

  setPinPinboard(pinboard: string): Promise<void> {
    return this.client.provider.set(this.guild, "Pin.Pinboard", pinboard);
  }
}
