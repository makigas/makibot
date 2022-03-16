import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { ApplicationCommandType } from "discord-api-types/v9";
import { ContextMenuInteraction } from "discord.js";
import type { ContextMenuInteractionHandler } from "../../lib/interaction";
import { handleKarmaInteraction } from "../../lib/karma/interaction";
import { createToast } from "../../lib/response";

export default class ViewKarmaCommand implements ContextMenuInteractionHandler {
  name = "Ver karma";

  build() {
    return new ContextMenuCommandBuilder().setName("Ver karma").setType(2);
  }

  async handle(event: ContextMenuInteraction): Promise<void> {
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
