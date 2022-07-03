import {
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "@discordjs/builders";
import type {
  ButtonInteraction,
  CommandInteraction,
  Interaction,
  MessageContextMenuInteraction,
  UserContextMenuInteraction,
} from "discord.js";
import path from "path";
import type Makibot from "../Makibot";
import logger from "./logger";
import { createToast } from "./response";
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
  /** Handle the command when sent to a guild. */
  handleGuild?: (event: CommandInteraction) => Promise<void>;

  /** Handle the command when sent to a DM. */
  handleDM?: (event: CommandInteraction) => Promise<void>;

  build():
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
}

export interface UserContextMenuInteractionHandler extends BaseInteractionHandler {
  /** Handle the command when sent to a guild. */
  handleGuild?: (event: UserContextMenuInteraction) => Promise<void>;

  /** Handle the command when sent to a DM. */
  handleDM?: (event: UserContextMenuInteraction) => Promise<void>;

  build(): ContextMenuCommandBuilder;
}

export interface MessageContextMenuInteractionHandler extends BaseInteractionHandler {
  /** Handle the command when sent to a guild. */
  handleGuild?: (event: MessageContextMenuInteraction) => Promise<void>;

  /** Handle the command when sent to a DM. */
  handleDM?: (event: MessageContextMenuInteraction) => Promise<void>;

  build(): ContextMenuCommandBuilder;
}

export interface ButtonInteractionHandler extends BaseInteractionHandler {
  /** Handle the command when sent to a guild. */
  handleGuild?: (event: ButtonInteraction) => Promise<void>;

  /** Handle the command when sent to a DM. */
  handleDM?: (event: ButtonInteraction) => Promise<void>;
}

function loadInteractions<T extends BaseInteractionHandler>(path: string): { [k: string]: T } {
  const handlers = requireAllModules(path).map<T>((HandlerClass) => {
    if (typeof HandlerClass === "function") {
      const handler = new (HandlerClass as { new (): T })();
      logger.debug(`[interactions] loaded interaction for ${handler.name}`);
      return handler;
    }
  });
  return mapBy(handlers, "name");
}

export class InteractionManager {
  private commands: Index<CommandInteractionHandler>;
  private usermenus: Index<UserContextMenuInteractionHandler>;
  private messagemenus: Index<MessageContextMenuInteractionHandler>;
  private buttons: Index<ButtonInteractionHandler>;

  constructor(readonly root: string, private readonly client: Makibot) {
    this.commands = loadInteractions(path.join(root, "commands"));
    this.usermenus = loadInteractions(path.join(root, "usermenus"));
    this.messagemenus = loadInteractions(path.join(root, "messagemenus"));
    this.buttons = loadInteractions(path.join(root, "buttons"));
    client.on("interactionCreate", this.handleInteraction.bind(this));
  }

  private async handleInteraction(interaction: Interaction): Promise<void> {
    if (interaction.isCommand()) {
      await this.handleCommandInteraction(interaction);
    }
    if (interaction.isContextMenu()) {
      if (interaction.isUserContextMenu()) {
        await this.handleUserContextMenuInteraction(interaction);
      } else if (interaction.isMessageContextMenu()) {
        await this.handleMessageContextMenuInteraction(interaction);
      }
    }
    if (interaction.isButton()) {
      await this.handleButtonInteraction(interaction);
    }
  }

  private async handleCommandInteraction(interaction: CommandInteraction): Promise<void> {
    const handler = this.commands[interaction.commandName];
    if (handler) {
      if (interaction.inGuild()) {
        if (handler.handleGuild) {
          await handler.handleGuild(interaction);
        } else {
          const toast = createToast({
            title: "Comando no apto en una guild",
            description: "Este comando no se puede usar en una guild",
            severity: "error",
          });
          await interaction.reply({
            embeds: [toast],
            ephemeral: true,
          });
        }
      } else {
        if (handler.handleDM) {
          await handler.handleDM(interaction);
        } else {
          const toast = createToast({
            title: "Comando no apto fuera de una guild",
            description: "Este comando no se puede usar fuera de una guild",
            severity: "error",
          });
          await interaction.reply({
            embeds: [toast],
            ephemeral: true,
          });
        }
      }
    }
  }

  private async handleUserContextMenuInteraction(
    interaction: UserContextMenuInteraction
  ): Promise<void> {
    const handler = this.usermenus[interaction.commandName];
    if (handler) {
      if (interaction.inGuild()) {
        if (handler.handleGuild) {
          await handler.handleGuild(interaction);
        } else {
          const toast = createToast({
            title: "Menú no apto en una guild",
            description: "Este menú no se puede pulsar en una guild",
            severity: "error",
          });
          await interaction.reply({
            embeds: [toast],
            ephemeral: true,
          });
        }
      } else {
        if (handler.handleDM) {
          await handler.handleDM(interaction);
        } else {
          const toast = createToast({
            title: "Menú no apto fuera de una guild",
            description: "Este menú no se puede pulsar fuera de una guild",
            severity: "error",
          });
          await interaction.reply({
            embeds: [toast],
            ephemeral: true,
          });
        }
      }
    }
  }

  private async handleMessageContextMenuInteraction(
    interaction: MessageContextMenuInteraction
  ): Promise<void> {
    const handler = this.messagemenus[interaction.commandName];
    if (handler) {
      if (interaction.inGuild()) {
        if (handler.handleGuild) {
          await handler.handleGuild(interaction);
        } else {
          const toast = createToast({
            title: "Menú no apto en una guild",
            description: "Este menú no se puede pulsar en una guild",
            severity: "error",
          });
          await interaction.reply({
            embeds: [toast],
            ephemeral: true,
          });
        }
      } else {
        if (handler.handleDM) {
          await handler.handleDM(interaction);
        } else {
          const toast = createToast({
            title: "Menú no apto fuera de una guild",
            description: "Este menú no se puede pulsar fuera de una guild",
            severity: "error",
          });
          await interaction.reply({
            embeds: [toast],
            ephemeral: true,
          });
        }
      }
    }
  }

  private async handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    const handler = this.buttons[interaction.customId];
    if (handler) {
      if (interaction.inGuild()) {
        if (handler.handleGuild) {
          await handler.handleGuild(interaction);
        } else {
          const toast = createToast({
            title: "Botón no apto en una guild",
            description: "Este botón no se puede pulsar en una guild",
            severity: "error",
          });
          await interaction.reply({
            embeds: [toast],
            ephemeral: true,
          });
        }
      } else {
        if (handler.handleDM) {
          await handler.handleDM(interaction);
        } else {
          const toast = createToast({
            title: "Botón no apto fuera de una guild",
            description: "Este botón no se puede pulsar fuera de una guild",
            severity: "error",
          });
          await interaction.reply({
            embeds: [toast],
            ephemeral: true,
          });
        }
      }
    }
  }
}
