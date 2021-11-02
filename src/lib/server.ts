import { Guild, Message, Role, TextChannel, UserResolvable, WebhookClient } from "discord.js";
import Makibot from "../Makibot";
import logger from "./logger";
import Member from "./member";
import { ModlogEvent } from "./modlog";
import Settings from "./settings";
import TagBag from "./tagbag";

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
  private _tagbag: TagBag;

  constructor(private guild: Guild) {}

  get id(): string {
    return this.guild.id;
  }

  get tagbag(): TagBag {
    if (!this._tagbag) {
      const client = this.guild.client as Makibot;
      this._tagbag = new TagBag(client.provider, this.guild.id, this.guild);
    }
    return this._tagbag;
  }

  toJSON(): ServerJSONSchema {
    return {
      id: this.guild.id,
      name: this.guild.name,
      icon: this.guild.iconURL(),
      roles: {
        helper: roleToJSON(this.helperRole),
        mods: roleToJSON(this.modsRole),
        warn: roleToJSON(this.warnRole),
      },
      channels: {
        pinboard: channelToJSON(this.pinboardChannel),
        publicModlog: channelToJSON(this.publicModlogChannel),
      },
    };
  }

  private getRoleByName(name: string): Role {
    if (!name) {
      return null;
    }
    return this.guild.roles.cache.find((role) => role.name === name) || null;
  }

  private getRoleByID(id: string): Role {
    if (!id) {
      return null;
    }
    return this.guild.roles.cache.find((role) => role.id === id) || null;
  }

  private getTextChannelByName(name: string): TextChannel {
    if (name) {
      const channel = this.guild.channels.cache.find((channel) => channel.name === name);
      if (channel && channel.type === "GUILD_TEXT") {
        return channel as TextChannel;
      } else {
        return null;
      }
    }
  }

  private getTextChannelByID(id: string): TextChannel {
    if (id) {
      const channel = this.guild.channels.cache.find((channel) => channel.id === id);
      if (channel && channel.type === "GUILD_TEXT") {
        return channel as TextChannel;
      } else {
        return null;
      }
    }
  }

  private getModlog(kind: string): WebhookClient | null {
    if (kind === "default") {
      const webhookId = this.settings.modlogWebhookId;
      const webhookToken = this.settings.modlogWebhookToken;
      if (webhookId && webhookToken) {
        return new WebhookClient({
          id: webhookId,
          token: webhookToken,
        });
      }
    } else if (kind === "sensible") {
      const webhookId = this.settings.sensibleModlogWebhookId;
      const webhookToken = this.settings.sensibleModlogWebhookToken;
      if (webhookId && webhookToken) {
        return new WebhookClient({
          id: webhookId,
          token: webhookToken,
        });
      }
    }
    return null;
  }

  private async doLogModlogEvent(event: ModlogEvent, kind: string): Promise<Message> {
    const client = this.getModlog(kind);
    if (client) {
      try {
        const payload = {
          username: event.title(),
          avatarURL: event.icon(),
          embeds: [event.toDiscordEmbed()],
        };
        logger.debug(`[webhook] attempting to send payload to webhook ${kind}`);
        const message = await client.send(payload);
        logger.debug(`[webhook] successfully sent webhook; handle ${message.id}`);
      } catch (e) {
        logger.error(`[webhook] failed to send the payload`);
        throw e;
      }
    } else {
      return Promise.reject(`Configuration error: no modlog for ${this.guild.name}`);
    }
  }

  async logModlogEvent(event: ModlogEvent): Promise<Message> {
    return this.doLogModlogEvent(event, "default");
  }

  async logSensibleModlogEvent(event: ModlogEvent): Promise<Message> {
    return this.doLogModlogEvent(event, "sensible");
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

  get muteRole(): Role {
    const mutedRoleName = process.env.MUTE_ROLE || "mute";
    return this.getRoleByName(mutedRoleName);
  }

  get warnRole(): Role {
    const warnRoleName = process.env.WARN_ROLE || "warn";
    return this.getRoleByName(warnRoleName);
  }

  get linksDisabledRole(): Role {
    const linksDisabledRole = process.env.LINKS_DISABLE_ROLE || "links-disabled";
    return this.getRoleByName(linksDisabledRole);
  }

  get karmaTiersRole(): { [level: number]: Role } {
    return this.settings.karmaTiers.reduce((obj, tier) => {
      const role = this.getRoleByID(tier.roleId);
      if (role) {
        obj[tier.minLevel] = role;
      }
      return obj;
    }, {});
  }

  get publicModlogChannel(): TextChannel {
    const modlogChannelName = process.env.PUBLIC_MODLOG_CHANNEL || "public-modlog";
    return this.getTextChannelByName(modlogChannelName);
  }

  get pinboardChannel(): TextChannel {
    const pinboardChannelName = this.settings.pinPinboard;
    return this.getTextChannelByName(pinboardChannelName);
  }

  async member(user: UserResolvable): Promise<Member> {
    try {
      const member = await this.guild.members.fetch(user);
      if (member) {
        return new Member(member);
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }
}
