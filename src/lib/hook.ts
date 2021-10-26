/* eslint-disable @typescript-eslint/no-var-requires */
import {
  GuildBan,
  GuildMember,
  Message,
  MessageReaction,
  PartialGuildMember,
  PartialMessage,
  User,
  VoiceState,
} from "discord.js";
import requireAll from "require-all";
import Makibot from "../Makibot";
import logger from "./logger";

export interface Hook {
  /* The identifier of the hook. */
  name: string;

  /** Allows restart? */
  allowsRestart?: boolean;

  /** Callback to ask the hook to restart itself. */
  restart?: () => void;

  onMessageCreate?: (message: Message) => Promise<void>;
  onMessageUpdate?: (oldMessage: Message, newMessage: Message) => Promise<void>;
  onMessageDestroy?: (message: PartialMessage) => Promise<void>;

  onMessageReactionAdd?: (reaction: MessageReaction, user: User) => Promise<void>;
  onMessageReactionDestroy?: (reaction: MessageReaction, user: User) => Promise<void>;
  onMessageReactionBulkDestroy?: (message: Message) => Promise<void>;

  onGuildMemberJoin?: (member: GuildMember) => Promise<void>;
  onGuildMemberLeave?: (member: PartialGuildMember) => Promise<void>;
  onGuildMemberBan?: (ban: GuildBan) => Promise<void>;

  onVoiceStateUpdate?: (oldStatus: VoiceState, newStatus: VoiceState) => Promise<void>;
}

export class HookManager {
  private watchdog: { [name: string]: Hook } = {};

  constructor(path: string, client: Makibot) {
    logger.debug("[hooks] registering services...");
    const hooks = requireAll({
      dirname: path,
      filter: /^([^.].*)\.[jt]s$/,
    });

    const instances: Hook[] = [];

    Object.values(hooks).forEach((hook) => {
      if (hook.default && typeof hook.default === "function") {
        /* close ES module resolution. */
        hook = hook.default;
      }

      const instance: Hook = new hook(client);
      instances.push(instance);
      if (instance.allowsRestart) {
        this.watchdog[instance.name] = instance;
      }
      logger.debug(`[hooks] registering service ${instance.name}`);
    });
    logger.debug("[hooks] finished registering services");

    client.on("messageCreate", (message: Message) => {
      if (message.interaction) {
        return;
      }
      instances
        .filter((i) => !!i.onMessageCreate)
        .map((i) => {
          logger.debug(`[hooks] processing messageCreate via ${i.name}`);
          return i.onMessageCreate(message);
        });
    });
    client.on(
      "messageUpdate",
      (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
        if (
          oldMessage.interaction ||
          newMessage.interaction ||
          oldMessage.flags.has("EPHEMERAL") ||
          newMessage.flags.has("EPHEMERAL")
        ) {
          return;
        }
        Promise.all([oldMessage.fetch(), newMessage.fetch()]).then(([oldMessage, newMessage]) => {
          instances
            .filter((i) => !!i.onMessageUpdate)
            .map((i) => {
              logger.debug(`[hooks] processing messageUpdate via ${i.name}`);
              return i.onMessageUpdate(oldMessage, newMessage);
            });
        });
      }
    );
    client.on("messageDelete", (message: PartialMessage) => {
      if (message.interaction) {
        return;
      }
      instances
        .filter((i) => !!i.onMessageDestroy)
        .map((i) => {
          logger.debug(`[hooks] processing messageDestroy via ${i.name}`);
          return i.onMessageDestroy(message);
        });
    });
    client.on("messageReactionAdd", (reaction, user) => {
      Promise.all([reaction.fetch(), user.fetch()]).then(([reaction, user]) => {
        instances
          .filter((i) => !!i.onMessageReactionAdd)
          .map((i) => {
            logger.debug(`[hooks] processing messageReactionAdd via ${i.name}`);
            return i.onMessageReactionAdd(reaction, user);
          });
      });
    });
    client.on("messageReactionRemove", (reaction, user) => {
      Promise.all([reaction.fetch(), user.fetch()]).then(([reaction, user]) => {
        instances
          .filter((i) => !!i.onMessageReactionDestroy)
          .map((i) => {
            logger.debug(`[hooks] processing messageReactionRemove via ${i.name}`);
            return i.onMessageReactionDestroy(reaction, user);
          });
      });
    });
    client.on("messageReactionRemoveAll", (message) => {
      message.fetch().then((message) => {
        instances
          .filter((i) => !!i.onMessageReactionBulkDestroy)
          .map((i) => {
            logger.debug(`[hooks] processing messageReactionRemoveAll via ${i.name}`);
            return i.onMessageReactionBulkDestroy(message);
          });
      });
    });
    client.on("guildMemberAdd", (member) => {
      instances
        .filter((i) => !!i.onGuildMemberJoin)
        .map((i) => {
          logger.debug(`[hooks] processing guildMemberAdd via ${i.name}`);
          return i.onGuildMemberJoin(member);
        });
    });
    client.on("guildMemberRemove", (member) => {
      instances
        .filter((i) => !!i.onGuildMemberLeave)
        .map((i) => {
          logger.debug(`[hooks] processing guildMemberAdd via ${i.name}`);
          return i.onGuildMemberLeave(member as PartialGuildMember);
        });
    });
    client.on("guildBanAdd", (ban) => {
      instances
        .filter((i) => !!i.onGuildMemberBan)
        .map((i) => {
          logger.debug(`[hooks] processing guildBanAdd via ${i.name}`);
          return i.onGuildMemberBan(ban);
        });
    });
    client.on("voiceStateUpdate", (oldState, newState) => {
      instances
        .filter((i) => !!i.onVoiceStateUpdate)
        .map((i) => {
          logger.debug(`[hooks] processing voiceStateUpdate via ${i.name}`);
          return i.onVoiceStateUpdate(oldState, newState);
        });
    });
  }

  restart(name: string): void {
    logger.debug(`[hooks] restarting service ${name}...`);
    this.watchdog[name]?.restart();
  }
}
