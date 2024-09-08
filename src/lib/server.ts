import {
  Guild,
  GuildAuditLogsEntry,
  GuildAuditLogsResolvable,
  Role,
  Snowflake,
  UserResolvable,
  WebhookClient,
  WebhookMessageOptions,
} from "discord.js";
import Makibot from "../Makibot";
import Member from "./member";
import Settings from "./settings";
import Tag from "./tag";
import TagBag from "./tagbag";

export type ServerJSONSchema = {
  id: string;
  name: string;
  icon: string | null;
};

type ModlogType = "default" | "delete" | "public";

export default class Server {
  readonly tagbag: TagBag;

  constructor(private guild: Guild) {
    const client = this.guild.client as Makibot;
    this.tagbag = new TagBag(client.provider, this.guild.id, this.guild);
  }

  async queryAuditLogEvent<T extends GuildAuditLogsResolvable>(
    type: T,
    finder: (event: GuildAuditLogsEntry<T>) => boolean,
  ): Promise<GuildAuditLogsEntry<T> | undefined> {
    const events = await this.guild.fetchAuditLogs({ type });
    return events.entries.find((event) => finder(event));
  }

  get id(): string {
    return this.guild.id;
  }

  async toJSON(): Promise<ServerJSONSchema> {
    return {
      id: this.guild.id,
      name: this.guild.name,
      icon: this.guild.iconURL(),
    };
  }

  async sendToModlog(kind: ModlogType, payload: WebhookMessageOptions): Promise<void> {
    const url = await this.tagbag.tag(`webhook:${kind}mod`).get(null);
    if (url) {
      const client = new WebhookClient({ url });
      await client.send(payload);
    }
  }

  private getRoleByName(name: string): Role | null {
    if (!name) {
      return null;
    }
    return this.guild.roles.cache.find((role) => role.name === name) || null;
  }

  private getRoleByID(id: string): Role | null {
    if (!id) {
      return null;
    }
    return this.guild.roles.cache.find((role) => role.id === id) || null;
  }

  get settings(): Settings {
    return new Settings(this.guild);
  }

  get modsRole(): Role | null {
    const modsRoleName = process.env.MODS_ROLE || "mods";
    return this.getRoleByName(modsRoleName);
  }

  async karmaTiersRole(): Promise<{ [level: number]: Role }> {
    const tiers = await this.settings.karmaTiers();
    const roles: { [level: number]: Role } = {};
    return tiers.reduce((obj, tier) => {
      const role = this.getRoleByID(tier.roleId);
      if (role) {
        obj[tier.minLevel] = role;
      }
      return obj;
    }, roles);
  }

  async member(user: UserResolvable): Promise<Member | null> {
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
