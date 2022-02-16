import { Guild } from "discord.js";
import Makibot from "../Makibot";
import Tag from "./tag";

type KarmaTierJSONSchema = {
  minLevel: number;
  roleId: string;
};

export type SettingsJSONSchema = {
  pin: {
    emoji: string;
    pinboard: string;
  };
  karmaTiers: KarmaTierJSONSchema[];
};

interface KarmaTier {
  minLevel: number;
  roleId: string;
}

export default class Settings {
  private readonly client: Makibot;

  private readonly tags: { [tag: string]: Tag };

  public constructor(guild: Guild) {
    this.client = guild.client as Makibot;
    this.tags = {
      pinEmoji: new Tag(this.client.provider, "Pin.Emoji", { guild }),
      pinChannel: new Tag(this.client.provider, "Pin.Pinboard", { guild }),
      karmaTiers: new Tag(this.client.provider, "Karma.Tiers", { guild }),
    };
  }

  public async toJSON(): Promise<SettingsJSONSchema> {
    return {
      pin: {
        emoji: await this.getPinEmoji(),
        pinboard: await this.getPinBoard(),
      },
      karmaTiers: await this.karmaTiers(),
    };
  }

  async getPinEmoji(): Promise<string> {
    return this.tags.pinEmoji.get("\u2b50");
  }

  async setPinEmoji(emoji: string): Promise<void> {
    await this.tags.pinEmoji.set(emoji);
  }

  async getPinBoard(): Promise<string> {
    return this.tags.pinChannel.get();
  }

  async setPinPinboard(pinboard: string): Promise<void> {
    await this.tags.pinChannel.set(pinboard);
  }

  karmaTiers(): Promise<KarmaTier[]> {
    return this.tags.karmaTiers.get([]);
  }

  async addTier(minLevel: number, roleId: string): Promise<void> {
    const tiers = await this.karmaTiers();

    /* Make sure that we don't add the level more than once. */
    const cleanTiers = tiers.filter((tier) => tier.minLevel != minLevel);

    /* Then add this level. */
    const newTiers = [...cleanTiers, { minLevel, roleId }];
    await this.tags.karmaTiers.set(newTiers);
  }

  async removeTier(minLevel: number): Promise<void> {
    const tiers = await this.karmaTiers();
    const cleanTiers = tiers.filter((tier) => tier.minLevel != minLevel);
    await this.tags.karmaTiers.set(cleanTiers);
  }

  async setRoleCrewId(id: string): Promise<void> {
    await this.tags.crewRoleId.set(id);
  }
}
