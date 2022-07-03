import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";

export default class PreguntasCommand implements CommandInteractionHandler {
  name = "invite";

  build() {
    return new SlashCommandBuilder()
      .setName("invite")
      .setDescription("Lanza el invite para unirse a este servidor");
  }

  async handleGuild(event: CommandInteraction): Promise<void> {
    if (process.env.INVITE_TOKEN) {
      return event.reply({
        content: "Invite para makigas https://discord.gg/" + process.env.INVITE_TOKEN,
      });
    } else {
      return event.reply({ content: "Invite vivo: <http://discord.makigas.es>" });
    }
  }
}
