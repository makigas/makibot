import { ModalSubmitInteraction } from "discord.js";
import { ModalInteractionHandler } from "../../lib/interaction";
import { proposeReport } from "../../lib/modlog";

export default class ReportModalSubmit implements ModalInteractionHandler {
  name = "report";

  async handle(event: ModalSubmitInteraction): Promise<void> {
    const messageId = event.customId.split(":")[1];
    if (!messageId) {
      await event.reply({
        content: "Interacción no válida por falta de parámetros, posiblemente sea falsa.",
        ephemeral: true,
      });
      return;
    }

    const channel = event.channel;
    if (!channel) {
      await event.reply({
        content: "Interacción no válida por falta de parámetros, no se ha usado en un servidor.",
        ephemeral: true,
      });
      return;
    }

    const message = await channel.messages.fetch(messageId, { force: true });
    await proposeReport(message, event.fields.getTextInputValue("modlogReport:issue"));
    await event.reply({
      content: "Se ha enviado la alerta correctamente a moderación. Gracias por cooperar.",
      ephemeral: true,
    });
  }
}
