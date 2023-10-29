import { tokenToDate } from "datetoken";
import { Message } from "discord.js";
import Makibot from "../../Makibot";
import Server from "../server";
import { ModEvent, ModEventType } from "./types";

interface ActionHooks {
  /**
   * Validates that an action can be applied. (For instance, you cannot
   * unmute someone who is not muted). If this function returns null,
   * it means it is possible to trigger the action. Otherwise, it returns
   * the string to present in the error message.
   * @param client the client (in order to fetch stuff)
   * @param event the event being tried to apply
   */
  validate(client: Makibot, event: ModEvent): Promise<string | null>;

  /**
   * Runs the action.
   * @param client the client (in order to fetch stuff)
   * @param event the event being tried to apply
   */
  apply(client: Makibot, event: ModEvent): Promise<void>;
}

const actions: { [type in ModEventType]: ActionHooks } = {
  DELETE: {
    apply: () => null,
    validate: () => null,
  },
  TIMEOUT: {
    apply: () => null,
    validate: () => null,
  },
  UNTIMEOUT: {
    async apply(client, event) {
      await client.modrepo.evictAny(event.target, "TIMEOUT");
    },
    validate: () => null,
  },
  WARN: {
    async validate(client, event) {
      const guild = await client.guilds.fetch(event.guild);
      const server = new Server(guild);
      const member = await server.member(event.target);
      return member.warned ? "Esta cuenta ya tiene una llamada de atención" : null;
    },
    async apply(client, event) {
      const guild = await client.guilds.fetch(event.guild);
      const server = new Server(guild);
      const member = await server.member(event.target);
      await member.setWarned(true);
    },
  },
  UNWARN: {
    async validate(client, event) {
      const guild = await client.guilds.fetch(event.guild);
      const server = new Server(guild);
      const member = await server.member(event.target);
      if (member) {
        return !member.warned ? "Esta cuenta no tiene ninguna llamada de atención" : null;
      }
      return null;
    },
    async apply(client, event) {
      const guild = await client.guilds.fetch(event.guild);
      const server = new Server(guild);
      const member = await server.member(event.target);
      if (member) {
        await member.setWarned(false);
      }
      await client.modrepo.evictAny(event.target, "WARN");
    },
  },
  MUTE: {
    async validate(client, event) {
      const guild = await client.guilds.fetch(event.guild);
      const server = new Server(guild);
      const member = await server.member(event.target);
      return member.muted ? "Esta cuenta ya está silenciada" : null;
    },
    async apply(client, event) {
      const guild = await client.guilds.fetch(event.guild);
      const server = new Server(guild);
      const member = await server.member(event.target);
      await member.setMuted(true);
    },
  },
  UNMUTE: {
    async validate(client, event) {
      const guild = await client.guilds.fetch(event.guild);
      const server = new Server(guild);
      const member = await server.member(event.target);
      if (member) {
        return !member.muted ? "Esta cuenta no está silenciada" : null;
      }
    },
    async apply(client, event) {
      const guild = await client.guilds.fetch(event.guild);
      const server = new Server(guild);
      const member = await server.member(event.target);
      if (member) {
        await member.setMuted(false);
      }
      await client.modrepo.evictAny(event.target, "MUTE");
    },
  },
  KICK: {
    async validate() {
      return null;
    },
    async apply(client, event) {
      const guild = await client.guilds.fetch(event.guild);
      const server = new Server(guild);
      const member = await server.member(event.target);
      await member.kick();
    },
  },
  BAN: {
    async validate() {
      return null;
    },
    async apply(client, event) {
      const guild = await client.guilds.fetch(event.guild);
      const server = new Server(guild);
      const member = await server.member(event.target);
      await member.ban(event.reason);
    },
  },
};

/**
 * Use this function to trigger a moderation event. This is the facade
 * function that will act on behalf of the real action, something
 * that depends on the kind of action that was taken.
 * @param event the moderation event to apply.
 * @return the persisted event.
 */
export async function applyAction(client: Makibot, event: ModEvent): Promise<ModEvent> {
  const hooks = actions[event.type];

  /* Validate that the action can be applied. */
  const validationResult = await hooks.validate(client, event);
  if (validationResult != null) {
    throw new Error(validationResult);
  }

  /* So we are in appliable land. Persist and apply the event. */
  const eventId = await client.modrepo.persistEvent(event);
  const cleanEvent = { ...event, id: eventId };
  hooks.apply(client, cleanEvent);
  return cleanEvent;
}

function castExpirationDate(expires?: string): Date {
  try {
    return tokenToDate(expires);
  } catch (e) {
    return null; // do not expire - handles null too
  }
}

export const modEventBuilder = (
  message: Message,
  type: ModEventType,
  reason: string,
  expires?: string,
): ModEvent => ({
  createdAt: new Date(),
  expired: false,
  guild: message.guildId,
  type,
  mod: message.client.user.id,
  reason,
  target: message.author.id,
  expiresAt: castExpirationDate(expires),
});
