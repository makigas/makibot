import {
  Guild,
  GuildAuditLogsEntry,
  GuildAuditLogsResolvable,
  Role,
  Snowflake,
  TextChannel,
  UserResolvable,
  WebhookClient,
  WebhookMessageOptions,
} from "discord.js";
import Makibot from "../Makibot";
import Member from "./member";
import Settings from "./settings";
import Tag from "./tag";
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

export type ServerJSONSchema = {
  id: string;
  name: string;
  icon: string;
  roles: { [key: string]: RoleJSONSchema | null };
};

export default class Server {
  private _tagbag: TagBag;

  constructor(private guild: Guild) {}

  async queryAuditLogEvent<T extends GuildAuditLogsResolvable>(
    type: T,
    finder: (event: GuildAuditLogsEntry<T>) => boolean
  ): Promise<GuildAuditLogsEntry<T>> {
    const events = await this.guild.fetchAuditLogs({ type });
    return events.entries.find((event) => finder(event));
  }

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

  async toJSON(): Promise<ServerJSONSchema> {
    return {
      id: this.guild.id,
      name: this.guild.name,
      icon: this.guild.iconURL(),
      roles: {
        helper: roleToJSON(this.helperRole),
        mods: roleToJSON(this.modsRole),
        warn: roleToJSON(this.warnRole),
      },
    };
  }

  async sendToModlog(
    kind: "default" | "sensible" | "delete" | "public",
    payload: WebhookMessageOptions
  ): Promise<void> {
    const url = await this.tagbag.tag(`webhook:${kind}mod`).get(null);
    if (url) {
      const client = new WebhookClient({ url });
      await client.send(payload);
    }
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

  async karmaTiersRole(): Promise<{ [level: number]: Role }> {
    const tiers = await this.settings.karmaTiers();
    return tiers.reduce((obj, tier) => {
      const role = this.getRoleByID(tier.roleId);
      if (role) {
        obj[tier.minLevel] = role;
      }
      return obj;
    }, {});
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

  private get trustedRoles(): Tag {
    return this.tagbag.tag("trustedroles");
  }

  /**
   * Returns the list of trusted (and safe) roles in this server.
   * @returns the list of roles currently in the list of trusted roles
   */
  getTrustedRoles(): Promise<Snowflake[]> {
    return this.trustedRoles.get([]);
  }

  /**
   * Add a trusted role into the list, unless it was already present.
   * @param id the id of the role to be added to the trusted list system.
   */
  async addTrustedRole(id: Snowflake): Promise<void> {
    const old = await this.getTrustedRoles();
    if (!old.includes(id)) {
      const next = [...old, id];
      await this.trustedRoles.set(next);
    }
  }

  /**
   * Delete a trusted role previously present in the trusted role list.
   * @param id the id of role to be removed from the trusted list system.
   */
  async deleteTrustedRole(id: Snowflake): Promise<void> {
    const old = await this.getTrustedRoles();
    console.log(`Quitamos ${id} de ${old}`);
    const next = old.filter((rid) => String(rid) !== String(id));
    await this.trustedRoles.set(next);
  }
}
