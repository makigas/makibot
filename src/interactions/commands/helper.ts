import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { startHelperManager } from "../../lib/makigas/helper";

export default class HelperCommand implements CommandInteractionHandler {
  name = "helper";

  build() {
    return new SlashCommandBuilder()
      .setName("helper")
      .setDescription("Configura tus roles de ayuda favoritos");
  }

  async handleGuild(event: CommandInteraction): Promise<void> {
    return startHelperManager(event);
  }
}
