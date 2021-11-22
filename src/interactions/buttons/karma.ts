import { ButtonInteraction } from "discord.js";
import { ButtonInteractionHandler } from "../../lib/interaction";
import { handleKarmaInteraction } from "../../lib/karma/interaction";
import { createToast } from "../../lib/response";

export default class KarmaButton implements ButtonInteractionHandler {
  name = "karma_button";

  async handle(event: ButtonInteraction): Promise<void> {
    if (event.inGuild()) {
      return handleKarmaInteraction(event, event.user.id);
    }
    const toast = createToast({
      title: "Comando no apto para DM",
      description: "Este comando sólo se puede usar en una guild",
      severity: "error",
    });
    return event.reply({ embeds: [toast] });
  }
}
