import type { CommandInteraction } from "discord.js";
import path from "path";
import requireAll from "require-all";
import type Makibot from "../Makibot";
import logger from "./logger";
import { createToast } from "./response";

export interface CommandInteractionHandler {
  name: string;
  handle(event: CommandInteraction): Promise<void>;
}

function loadCommandInteractions(path: string): { [name: string]: CommandInteractionHandler } {
  logger.debug("[interactions] loading interactions...");
  const interactions = requireAll({
    dirname: path,
    filter: /^([^.].*)\.[jt]s$/,
  });

  const handlers = Object.values(interactions).map((interaction) => {
    if (interaction.default && typeof interaction.default === "function") {
      /* close ES module resolution. */
      interaction = interaction.default;
    }

    const instance: CommandInteractionHandler = new interaction();
    logger.debug(`[interactions] loading interaction: ${instance.name}`);
    return [instance.name, instance];
  });

  logger.debug("[interactions] finished loading interactions");
  return Object.fromEntries(handlers);
}

export function installCommandInteractionHandler(root: string, client: Makibot): void {
  const commands = loadCommandInteractions(path.join(root, "commands"));
  const menus = loadCommandInteractions(path.join(root, "menus"));

  client.on("interactionCreate", (interaction) => {
    if (interaction.isCommand()) {
      const handler = commands[interaction.commandName];
      if (handler) {
        return handler.handle(interaction);
      } else {
        return interaction.reply({
          embeds: [
            createToast({
              title: "Comando no reconocido",
              description: "Es posible que el servidor o DM tenga deshabilitado el comando.",
              severity: "error",
            }),
          ],
          ephemeral: true,
        });
      }
    } else if (interaction.isContextMenu()) {
      const handler = menus[interaction.commandName];
      if (handler) {
        return handler.handle(interaction);
      } else {
        return interaction.reply({
          embeds: [
            createToast({
              title: "Elemento de menú no reconocido",
              description:
                "Es posible que el elemento de menú no esté disponible para este servidor o canal de DM.",
              severity: "error",
            }),
          ],
          ephemeral: true,
        });
      }
    }
  });
}
