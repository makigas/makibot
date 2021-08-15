import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { createToast } from "../../lib/response";

export default class RaidCommand implements CommandInteractionHandler {
  name = "raid";

  async handle(command: CommandInteraction): Promise<void> {
    const enabled = command.options.getBoolean("raid-mode", false) || false;
    const toast = createToast({
      title: `El modo raid ha sido ${enabled ? "activado" : "desactivado"}`,
      severity: "info",
    });
    return command.reply({
      embeds: [toast],
      ephemeral: true,
    });
  }
}
