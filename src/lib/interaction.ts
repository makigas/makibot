import {
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "@discordjs/builders";
import type {
  CommandInteraction,
  Interaction,
  MessageContextMenuInteraction,
  UserContextMenuInteraction,
} from "discord.js";
import path from "path";
import type Makibot from "../Makibot";
import logger from "./logger";
import { Index, mapBy } from "./utils/functional";
import { requireAllModules } from "./utils/loader";

/**
 * An interaction handler is a class that manages the logic for a Discord
 * Interaction. Interactions are the new system proposed by Discord so that
 * users can request actions to happen from bots, instead of using text
 * messages or reactions.
 */
interface BaseInteractionHandler {
  /**
   * The name of the interaction handler. It is supposed to be unique per
   * interaction from withing the same kind (command, context, button,
   * select...). Depending on the interaction kind, it will mean something
   * different.
   *
   * - For command interactions, it is the name of the slash command.
   * - For context menus, it is the label presented in the menu.
   * - For components, it is the internal name sent in the payload.
   */
  name: string;
}

export interface CommandInteractionHandler extends BaseInteractionHandler {
  handle(event: CommandInteraction): Promise<void>;
  build():
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
}

export interface UserContextMenuInteractionHandler extends BaseInteractionHandler {
  handle(event: UserContextMenuInteraction): Promise<void>;
  build(): ContextMenuCommandBuilder;
}

export interface MessageContextMenuInteractionHandler extends BaseInteractionHandler {
  handle(event: MessageContextMenuInteraction): Promise<void>;
  build(): ContextMenuCommandBuilder;
}

type InteractionHandlerConstructor<T extends BaseInteractionHandler> = {
  new (): T;
};

function isValidHandlerConstructor<T extends BaseInteractionHandler>(
  object: unknown,
): object is InteractionHandlerConstructor<T> {
  return typeof object === "function";
}

function loadInteractions<T extends BaseInteractionHandler>(path: string): { [k: string]: T } {
  const modules = requireAllModules(path);
  const interactions: T[] = [];
  modules.forEach((HandlerClass) => {
    if (isValidHandlerConstructor(HandlerClass)) {
      const instance: T = new HandlerClass() as T;
      logger.debug(`[interactions] loaded interaction for ${instance.name}`);
      interactions.push(instance);
    }
  });
  return mapBy(interactions, "name");
}

export class InteractionManager {
  private commands: Index<CommandInteractionHandler>;
  private usermenus: Index<UserContextMenuInteractionHandler>;
  private messagemenus: Index<MessageContextMenuInteractionHandler>;

  constructor(
    readonly root: string,
    private readonly client: Makibot,
  ) {
    this.commands = loadInteractions(path.join(root, "commands"));
    this.usermenus = loadInteractions(path.join(root, "usermenus"));
    this.messagemenus = loadInteractions(path.join(root, "messagemenus"));
    client.on("interactionCreate", this.handleInteraction.bind(this));
  }

  private async handleInteraction(interaction: Interaction): Promise<void> {
    if (interaction.isCommand()) {
      await this.commands[interaction.commandName]?.handle(interaction);
    } else if (interaction.isUserContextMenu()) {
      await this.usermenus[interaction.commandName]?.handle(interaction);
    } else if (interaction.isMessageContextMenu()) {
      await this.messagemenus[interaction.commandName]?.handle(interaction);
    }
  }
}
