import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { startHelperManager } from "../../lib/makigas/helper";
import { createToast } from "../../lib/response";

export default class HelperCommand implements CommandInteractionHandler {
  name = "helper";

  build() {
    return new SlashCommandBuilder()
      .setName("helper")
      .setDescription("Configura tus roles de ayuda favoritos");
  }

  async handle(event: CommandInteraction): Promise<void> {
    if (event.inGuild()) {
      return startHelperManager(event);
    }
    const toast = createToast({
      title: "Comando no apto para DM",
      description: "Este comando sólo se puede usar en una guild",
      severity: "error",
    });
    return event.reply({ embeds: [toast] });
  }
}
