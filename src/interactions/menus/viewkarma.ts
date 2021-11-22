import { CommandInteraction } from "discord.js";
import type { CommandInteractionHandler } from "../../lib/interaction";
import { handleKarmaInteraction } from "../../lib/karma/interaction";
import { createToast } from "../../lib/response";

export default class ViewKarmaCommand implements CommandInteractionHandler {
  name = "Ver karma";

  async handle(event: CommandInteraction): Promise<void> {
    if (event.inGuild()) {
      const value = String(event.options.get("user").value);
      return handleKarmaInteraction(event, value);
    }
    const toast = createToast({
      title: "Comando no apto para DM",
      description: "Este comando sólo se puede usar en una guild",
      severity: "error",
    });
    return event.reply({ embeds: [toast] });
  }
}
