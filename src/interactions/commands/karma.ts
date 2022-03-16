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
      .setDescription("Consulta la reputación y nivel")
      .addUserOption((o) => o.setName("cuenta").setDescription("¿De quién miramos el karma?"));
  }

  async handle(event: CommandInteraction): Promise<void> {
    if (event.inGuild()) {
      const userId = event.options.getUser("cuenta", false)?.id || event.user.id;
      return handleKarmaInteraction(event, userId);
    }
    const toast = createToast({
      title: "Comando no apto para DM",
      description: "Este comando sólo se puede usar en una guild",
      severity: "error",
    });
    return event.reply({ embeds: [toast] });
  }
}
