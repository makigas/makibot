import { Guild, Snowflake } from "discord.js";
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
  modlog: {
    webhookId: string;
    webhookToken: string;
  };
  sensibleModlog: {
    webhookId: string;
    webhookToken: string;
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
      modlogWebhookId: new Tag(this.client.provider, "Webhook.Id", { guild }),
      modlogWebhookToken: new Tag(this.client.provider, "Webhook.Token", { guild }),
      sensibleModlogWebhookId: new Tag(this.client.provider, "PrivateModlog.Id", { guild }),
      sensibleModlogWebhookToken: new Tag(this.client.provider, "PrivateModlog.Token", { guild }),
      karmaTiers: new Tag(this.client.provider, "Karma.Tiers", { guild }),
    };
  }

  public toJSON(): SettingsJSONSchema {
    return {
      pin: {
        emoji: this.pinEmoji,
        pinboard: this.pinPinboard,
      },
      karmaTiers: this.karmaTiers,
      modlog: {
        webhookId: this.modlogWebhookId,
        webhookToken: this.modlogWebhookToken,
      },
      sensibleModlog: {
        webhookId: this.sensibleModlogWebhookId,
        webhookToken: this.sensibleModlogWebhookToken,
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

  get modlogWebhookId(): Snowflake {
    return this.tags.modlogWebhookId.get();
  }

  get modlogWebhookToken(): string {
    return this.tags.modlogWebhookToken.get();
  }

  get sensibleModlogWebhookId(): Snowflake {
    return this.tags.sensibleModlogWebhookId.get();
  }

  get sensibleModlogWebhookToken(): string {
    return this.tags.sensibleModlogWebhookToken.get();
  }

  get karmaTiers(): KarmaTier[] {
    return this.tags.karmaTiers.get([]);
  }

  async addTier(minLevel: number, roleId: string): Promise<void> {
    const tiers = this.karmaTiers;

    /* Make sure that we don't add the level more than once. */
    const cleanTiers = tiers.filter((tier) => tier.minLevel != minLevel);

    /* Then add this level. */
    const newTiers = [...cleanTiers, { minLevel, roleId }];
    await this.tags.karmaTiers.set(newTiers);
  }

  async removeTier(minLevel: number): Promise<void> {
    const tiers = this.karmaTiers;
    const cleanTiers = tiers.filter((tier) => tier.minLevel != minLevel);
    await this.tags.karmaTiers.set(cleanTiers);
  }

  async setRoleCrewId(id: string): Promise<void> {
    await this.tags.crewRoleId.set(id);
  }

  async setModlogWebhookId(id: string): Promise<void> {
    await this.tags.modlogWebhookId.set(id);
  }

  async setModlogWebhookToken(token: string): Promise<void> {
    await this.tags.modlogWebhookToken.set(token);
  }

  async setSensibleModlogWebhookId(id: string): Promise<void> {
    await this.tags.sensibleModlogWebhookId.set(id);
  }

  async setSensibleModlogWebhookToken(token: string): Promise<void> {
    await this.tags.sensibleModlogWebhookToken.set(token);
  }
}
