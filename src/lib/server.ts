import {
  Guild,
  GuildAuditLogsEntry,
  GuildAuditLogsResolvable,
  Permissions,
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

const LOCKDOWN_PERMISSIONS = [
  Permissions.FLAGS.SEND_MESSAGES,
  Permissions.FLAGS.SEND_MESSAGES_IN_THREADS,
  Permissions.FLAGS.CREATE_PUBLIC_THREADS,
  Permissions.FLAGS.CREATE_PRIVATE_THREADS,
];

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

  async lockdown(channelId?: Snowflake) {
    if (channelId) {
      /* They have asked me to mute a channel */
      const channel = await this.guild.channels.fetch(channelId);
      if (channel) {
        channel.permissionOverwrites.create(
          channel.guild.roles.everyone,
          Object.fromEntries(LOCKDOWN_PERMISSIONS.map((p) => [p, false]))
        );
      }
    } else {
      /* Lock the entire server. */
      const newBitmap = this.guild.roles.everyone.permissions.remove(LOCKDOWN_PERMISSIONS);
      await this.guild.roles.everyone.setPermissions(newBitmap);
    }
  }

  async liftLockdown(channelId?: Snowflake) {
    if (channelId) {
      /* They have asked me to mute a channel */
      const channel = await this.guild.channels.fetch(channelId);
      if (channel) {
        channel.permissionOverwrites.create(
          channel.guild.roles.everyone,
          Object.fromEntries(LOCKDOWN_PERMISSIONS.map((p) => [p, null]))
        );
      }
    } else {
      /* Unlock the entire server. */
      const newBitmap = this.guild.roles.everyone.permissions.add(LOCKDOWN_PERMISSIONS);
      await this.guild.roles.everyone.setPermissions(newBitmap);
    }
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
      channels: {
        pinboard: await channelToJSON(await this.pinboardChannel()),
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

  async pinboardChannel(): Promise<TextChannel> {
    const pinboardChannelName = await this.settings.getPinBoard();
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

  /**
   * Returns the tag that contains the list of channels where thread is the
   * primary communication source. This tag points to an array of snowflakes.
   * Sending a message to one of the channels in the array should spawn a
   * communications channel, which is handled by the threadchannel.ts hook.
   */
  private get threadChannels(): Tag {
    return this.tagbag.tag("threadchannels");
  }

  /**
   * Returns a list of threadchannels. These are channels where comunications
   * are hold in threads. Sending a message to one of the channels in the
   * array should open a thread, which is done by the threadchannel.ts hook.
   * @returns a promise that resolves to the current array value.
   */
  getThreadChannels(): Promise<Snowflake[]> {
    return this.threadChannels.get([]);
  }

  /**
   * Adds an id to the array of snowflakes contained in threadChannels.
   * If the id was already present, this function does a NOOP.
   * @param id the snowflake to add to the list.
   * @returns a promise that once fulfilled will have this id added.
   */
  async addThreadChannel(id: Snowflake): Promise<void> {
    const old = await this.getThreadChannels();
    if (!old.includes(id)) {
      const next = [...old, id];
      await this.threadChannels.set(next);
    }
  }

  /**
   * Removes an id from the array of snowflakes contained in threadChannels.
   * If the id was not present, this function does a NOOP.
   * @param id the snowflake to remove from the list.
   * @returns a promise that once fulfilled will have this id removed.
   */
  async deleteThreadChannel(id: Snowflake): Promise<void> {
    const old = await this.getThreadChannels();
    const next = old.filter((tid) => String(tid) !== String(id));
    await this.threadChannels.set(next);
  }

  /**
   * Returns the tag for storing the list of linkchannels for this server.
   * Link channels are channels where the only kind of acceptable messages
   * are links. If the message does not contain a link, it should be removed.
   * If the message contains a link, the hook will usually open a thread to
   * discuss the link.
   */
  private get linkChannels(): Tag {
    return this.tagbag.tag("linkchannels");
  }

  /**
   * Returns the current list of linkchannels, which are channels where the
   * communication should be kept in threads and these threads should only
   * discuss links.
   * @returns a promise that resolves to the array of channels in the list.
   */
  getLinkChannels(): Promise<Snowflake[]> {
    return this.linkChannels.get([]);
  }

  /**
   * Adds an id to the array of snowflakes contained in linkChannels.
   * If the id was already present, this function does a NOOP.
   * @param id the snowflake to add to the list.
   * @returns a promise that once fulfilled will have this id added.
   */
  async addLinkChannel(id: Snowflake): Promise<void> {
    const old = await this.getLinkChannels();
    if (!old.includes(id)) {
      const next = [...old, id];
      await this.linkChannels.set(next);
    }
  }

  /**
   * Removes an id from the array of snowflakes contained in linkChannels.
   * If the id was not present, this function does a NOOP.
   * @param id the snowflake to remove from the list.
   * @returns a promise that once fulfilled will have this id removed.
   */
  async deleteLinkChannel(id: Snowflake): Promise<void> {
    const old = await this.getLinkChannels();
    const next = old.filter((tid) => String(tid) !== String(id));
    await this.linkChannels.set(next);
  }
}
