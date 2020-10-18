import { Guild, Message, Role, TextChannel, WebhookClient } from "discord.js";
import { ModlogEvent } from "./modlog";
import Settings from "./settings";

type RoleJSONSchema = {
  id: string;
  name: string;
  color: string;
};

function roleToJSON(role?: Role): null | RoleJSONSchema {
  if (!role) return null;
  return {
    id: role.id,
    name: role.name,
    color: role.hexColor,
  };
}

type ChannelJSONSchema = {
  id: string;
  name: string;
};

function channelToJSON(channel?: TextChannel): null | ChannelJSONSchema {
  if (!channel) return null;
  return {
    id: channel.id,
    name: channel.name,
  };
}

export type ServerJSONSchema = {
  id: string;
  name: string;
  icon: string;
  roles: { [key: string]: RoleJSONSchema | null };
  channels: { [key: string]: ChannelJSONSchema | null };
};

export default class Server {
  constructor(private guild: Guild) { }

  toJSON(): ServerJSONSchema {
    return {
      id: this.guild.id,
      name: this.guild.name,
      icon: this.guild.iconURL,
      roles: {
        helper: roleToJSON(this.helperRole),
        mods: roleToJSON(this.modsRole),
        verified: roleToJSON(this.verifiedRole),
        warn: roleToJSON(this.warnRole),
      },
      channels: {
        pinboard: channelToJSON(this.pinboardChannel),
        publicModlog: channelToJSON(this.publicModlogChannel),
        captchas: channelToJSON(this.captchasChannel),
      },
    };
  }

  private getRoleByName(name: string): Role {
    if (!name) {
      return null;
    }
    return this.guild.roles.find((role) => role.name === name) || null;
  }

  private getRoleByID(id: string): Role {
    if (!id) {
      return null;
    }
    return this.guild.roles.find((role) => role.id === id) || null;
  }

  private getTextChannelByName(name: string): TextChannel {
    if (name) {
      const channel = this.guild.channels.find((channel) => channel.name === name);
      if (channel && channel.type === "text") {
        return channel as TextChannel;
      } else {
        return null;
      }
    }
  }

  private getTextChannelByID(id: string): TextChannel {
    if (id) {
      const channel = this.guild.channels.find((channel) => channel.id === id);
      if (channel && channel.type === "text") {
        return channel as TextChannel;
      } else {
        return null;
      }
    }
  }

  logModlogEvent(event: ModlogEvent): Promise<Message> {
    const webhookId = this.settings.modlogWebhookId;
    const webhookToken = this.settings.modlogWebhookToken;
    if (webhookId && webhookToken) {
      const client = new WebhookClient(webhookId, webhookToken);
      return client.send({
        username: event.title(),
        avatarURL: event.icon(),
        embeds: [event.toDiscordEmbed()],
      });
    } else {
      return Promise.reject(`Configuration error: no modlog for ${this.guild.name}`);
    }
  }

  get settings(): Settings {
    return new Settings(this.guild);
  }

  get helperRole(): Role {
    const helperRoleName = process.env.HELPER_ROLE || "helpers";
    return this.getRoleByName(helperRoleName);
  }

  get modsRole(): Role {
    const modsRoleName = process.env.MODS_ROLE || "mods";
    return this.getRoleByName(modsRoleName);
  }

  get verifiedRole(): Role {
    const verifiedRoleName = process.env.VERIFY_ROLE || "verified";
    return this.getRoleByName(verifiedRoleName);
  }

  get warnRole(): Role {
    const warnRoleName = process.env.WARN_ROLE || "warn";
    return this.getRoleByName(warnRoleName);
  }

  get trustedRole(): Role {
    const trustedRoleName = process.env.TRUSTED_ROLE || "trusted";
    return this.getRoleByName(trustedRoleName);
  }

  get publicModlogChannel(): TextChannel {
    const modlogChannelName = process.env.PUBLIC_MODLOG_CHANNEL || "public-modlog";
    return this.getTextChannelByName(modlogChannelName);
  }

  get captchasChannel(): TextChannel {
    const captchasChannelName = process.env.VERIFY_CHANNEL || "captchas";
    return this.getTextChannelByName(captchasChannelName);
  }

  get pinboardChannel(): TextChannel {
    const pinboardChannelName = this.settings.pinPinboard;
    return this.getTextChannelByName(pinboardChannelName);
  }
}
