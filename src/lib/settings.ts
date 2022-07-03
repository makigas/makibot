import { Guild } from "discord.js";
import Makibot from "../Makibot";
import Tag from "./tag";

type KarmaTierJSONSchema = {
  minLevel: number;
  roleId: string;
};

export type SettingsJSONSchema = {
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
      karmaTiers: new Tag(this.client.provider, "Karma.Tiers", { guild }),
    };
  }

  public async toJSON(): Promise<SettingsJSONSchema> {
    return {
      karmaTiers: await this.karmaTiers(),
    };
  }

  async karmaTiers(): Promise<KarmaTier[]> {
    const tiers = await this.tags.karmaTiers.get([]);
    if (typeof tiers === "string") {
      return JSON.parse(tiers);
    }
    return tiers as KarmaTier[];
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
