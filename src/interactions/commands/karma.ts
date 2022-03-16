import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { handleKarmaInteraction } from "../../lib/karma/interaction";
import { createToast } from "../../lib/response";

export default class KarmaCommand implements CommandInteractionHandler {
  name = "karma";

  build() {
    return new SlashCommandBuilder()
      .setName("karma")
      .setDescription("Consulta la reputación y nivel");
  }

  async handle(event: CommandInteraction): Promise<void> {
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
