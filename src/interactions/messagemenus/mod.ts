import {
  MessageActionRow,
  MessageContextMenuInteraction,
  Modal,
  TextInputComponent,
} from "discord.js";
import { ContextMenuCommandBuilder } from "@discordjs/builders";
import type { MessageContextMenuInteractionHandler } from "../../lib/interaction";
import { createToast } from "../../lib/response";
import Server from "../../lib/server";

export default class ModRequestCommand implements MessageContextMenuInteractionHandler {
  name = "Avisar a moderación";

  build() {
    return new ContextMenuCommandBuilder().setName("Avisar a moderación").setType(3);
  }

  async handle(interaction: MessageContextMenuInteraction): Promise<void> {
    /* I'm only extracting the parameters here to avoid promises. */
    if (interaction.guild && interaction.channel) {
      const server = new Server(interaction.guild);
      const reporter = await server.member(interaction.user);
      const message = await interaction.channel.messages.fetch(interaction.targetMessage.id);

      if (!reporter) {
        await interaction.reply({
          ephemeral: true,
          embeds: [
            createToast({
              title: "Error al utilizar el comando",
              description: "Tenemos un problema para extraer los datos del mensaje a reportar",
              severity: "error",
            }),
          ],
        });
        return;
      }

      const modal = new Modal().setCustomId("report:" + message.id).setTitle("Avisar a moderación");
      const description = new TextInputComponent()
        .setCustomId("modlogReport:issue")
        .setLabel("¿Qué problema tiene este mensaje?")
        .setRequired(true)
        .setStyle("PARAGRAPH")
        .setPlaceholder("Indica el problema que ves en este mensaje")
        .setMaxLength(200);
      const row = new MessageActionRow({
        components: [description],
      });
      modal.addComponents(row);
      await interaction.showModal(modal);
    }
  }
}
