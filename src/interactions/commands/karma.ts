import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { handleKarmaInteraction } from "../../lib/karma/interaction";

export default class KarmaCommand implements CommandInteractionHandler {
  name = "karma";

  build() {
    return new SlashCommandBuilder()
      .setName("karma")
      .setDescription("Consulta la reputación y nivel")
      .addUserOption((o) => o.setName("cuenta").setDescription("¿De quién miramos el karma?"));
  }

  async handleGuild(event: CommandInteraction): Promise<void> {
    const userId = event.options.getUser("cuenta", false)?.id || event.user.id;
    return handleKarmaInteraction(event, userId);
  }
}
