import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { startRoleManager } from "../../lib/makigas/roles";
import { createToast } from "../../lib/response";

export default class RolesCommand implements CommandInteractionHandler {
  name = "roles";

  build() {
    return new SlashCommandBuilder()
      .setName("roles")
      .setDescription("Establece tus roles en este servidor");
  }

  async handleGuild(event: CommandInteraction): Promise<void> {
    return startRoleManager(event);
  }
}
