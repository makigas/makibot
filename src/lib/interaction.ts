import {
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "@discordjs/builders";
import type {
  ButtonInteraction,
  CommandInteraction,
  ContextMenuInteraction,
  Guild,
  Interaction,
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

export interface ContextMenuInteractionHandler extends BaseInteractionHandler {
  handle(event: ContextMenuInteraction): Promise<void>;
  build(): ContextMenuCommandBuilder;
}

export interface ButtonInteractionHandler extends BaseInteractionHandler {
  handle(event: ButtonInteraction): Promise<void>;
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
  private menus: Index<ContextMenuInteractionHandler>;
  private buttons: Index<ButtonInteractionHandler>;

  constructor(readonly root: string, private readonly client: Makibot) {
    this.commands = loadInteractions(path.join(root, "commands"));
    this.menus = loadInteractions(path.join(root, "menus"));
    this.buttons = loadInteractions(path.join(root, "buttons"));
    client.on("interactionCreate", this.handleInteraction.bind(this));
  }

  private async handleInteraction(interaction: Interaction): Promise<void> {
    if (interaction.isCommand()) {
      await this.handleCommandInteraction(interaction);
    }
    if (interaction.isContextMenu()) {
      await this.handleContextMenuInteraction(interaction);
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

  private async handleContextMenuInteraction(interaction: ContextMenuInteraction): Promise<void> {
    const handler = this.menus[interaction.commandName];
    if (handler) {
      await handler.handle(interaction);
    }
  }

  private async handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    const handler = this.buttons[interaction.customId];
    if (handler) {
      await handler.handle(interaction);
    }
  }
}
