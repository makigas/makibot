import type { CommandInteraction, ContextMenuInteraction, Interaction, MessageComponentInteraction } from "discord.js";
import path from "path";
import requireAll from "require-all";
import type Makibot from "../Makibot";
import logger from "./logger";

export interface CommandInteractionHandler {
  name: string;
  handle(event: CommandInteraction | ContextMenuInteraction): Promise<void>;
}

export interface ComponentInteractionHandler {
  name: string;
  handle(event: MessageComponentInteraction): Promise<void>;
}

function loadInteractions(path: string): any[] {
  const interactions = requireAll({
    dirname: path,
    filter: /^([^.].*)\.[jt]s$/,
  });

  return Object.values(interactions).map((interaction) => {
    if (interaction.default && typeof interaction.default === "function") {
      /* close ES module resolution. */
      interaction = interaction.default;
    }
    return interaction;
  });
}

function loadCommandInteractions(path: string): { [name: string]: CommandInteractionHandler } {
  logger.debug("[interactions] loading command interactions...");
  const handlers = loadInteractions(path).map((interaction) => {
    const instance: CommandInteractionHandler = new interaction();
    logger.debug(`[interactions] loading command interaction: ${instance.name}`);
    return [instance.name, instance];
  });
  logger.debug("[interactions] finished loading command interactions");
  return Object.fromEntries(handlers);
}

function loadComponentInteractions(path: string): { [name: string]: ComponentInteractionHandler } {
  logger.debug("[interactions] loading component interactions...");
  const handlers = loadInteractions(path).map((interaction) => {
    const instance: ComponentInteractionHandler = new interaction();
    logger.debug(`[interactions] loading component interaction: ${instance.name}`);
    return [instance.name, instance];
  });
  logger.debug("[interactions] finished loading component interactions");
  return Object.fromEntries(handlers);
}

export function installCommandInteractionHandler(root: string, client: Makibot): void {
  const commands = loadCommandInteractions(path.join(root, "commands"));
  const menus = loadCommandInteractions(path.join(root, "menus"));
  const selects = loadComponentInteractions(path.join(root, "selects"));
  const buttons = loadComponentInteractions(path.join(root, "buttons"));

  function getCommandHandler(interaction: Interaction): CommandInteractionHandler | null {
    if (interaction.isCommand()) {
      return commands[interaction.commandName];
    } else if (interaction.isContextMenu()) {
      return menus[interaction.commandName];
    }
    return null;
  }

  function getComponentHandler(interaction: Interaction): ComponentInteractionHandler | null {
    if (interaction.isSelectMenu()) {
      return selects[interaction.customId];
    } else if (interaction.isButton()) {
      return buttons[interaction.customId];
    }
    return null;
  }

  client.on("interactionCreate", (interaction) => {
    logger.debug("[interactions] received interaction", interaction);

    if (interaction.isCommand() || interaction.isContextMenu()) {
      const handler = getCommandHandler(interaction);
      if (handler) {
        handler.handle(interaction);
      }
    } else if (interaction.isSelectMenu() || interaction.isButton()) {
      const handler = getComponentHandler(interaction);
      if (handler) {
        handler.handle(interaction);
      }
    }
  });
}
