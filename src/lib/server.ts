import { Guild, Role, TextChannel, UserResolvable, WebhookClient } from "discord.js";
import Makibot from "../Makibot";
import Member from "./member";
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
      },
    };
  }

  private modlog(kind: string): WebhookClient {
    const url = this.tagbag.tag(kind).get(null);
    if (url) {
      return new WebhookClient({ url: url });
    }
    return null;
  }

  get publicModlog(): WebhookClient {
    return this.modlog("webhook:publicmod");
  }

  get defaultModlog(): WebhookClient {
    return this.modlog("webhook:defaultmod");
  }

  get sensibleModlog(): WebhookClient {
    return this.modlog("webhook:sensiblemod");
  }

  get deletionModlog(): WebhookClient {
    return this.modlog("webhook:deletemod");
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
