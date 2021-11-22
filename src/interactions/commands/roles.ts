import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { startRoleManager } from "../../lib/makigas/roles";
import { createToast } from "../../lib/response";

export default class RolesCommand implements CommandInteractionHandler {
  name = "roles";

  async handle(event: CommandInteraction): Promise<void> {
    if (event.inGuild()) {
      return startRoleManager(event);
    }
    const toast = createToast({
      title: "Comando no apto para DM",
      description: "Este comando sólo se puede usar en una guild",
      severity: "error",
    });
    return event.reply({ embeds: [toast] });
  }
}
