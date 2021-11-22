import { ButtonInteraction } from "discord.js";
import { ButtonInteractionHandler } from "../../lib/interaction";
import { startRoleManager } from "../../lib/makigas/roles";
import { createToast } from "../../lib/response";

export default class RolesButton implements ButtonInteractionHandler {
  name = "roles_button";

  async handle(event: ButtonInteraction): Promise<void> {
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
