import { Guild } from "discord.js";
import Makibot from "../Makibot";
import Tag from "./tag";

export type SettingsJSONSchema = {
  pin: {
    emoji: string;
    pinboard: string;
  };
  modlog: {
    webhookId: string;
    webhookToken: string;
  };
};

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
    };
  }

  public toJSON(): SettingsJSONSchema {
    return {
      pin: {
        emoji: this.pinEmoji,
        pinboard: this.pinPinboard,
      },
      modlog: {
        webhookId: this.modlogWebhookId,
        webhookToken: this.modlogWebhookToken,
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

  get modlogWebhookId(): string {
    return this.tags.modlogWebhookId.get();
  }

  get modlogWebhookToken(): string {
    return this.tags.modlogWebhookToken.get();
  }

  async setModlogWebhookId(id: string): Promise<void> {
    await this.tags.modlogWebhookId.set(id);
  }

  async setModlogWebhookToken(token: string): Promise<void> {
    await this.tags.modlogWebhookToken.set(token);
  }
}
