import { ButtonInteraction } from "discord.js";
import { ComponentInteractionHandler } from "../../lib/interaction";
import { ReportModlogEvent } from "../../lib/modlog";
import { ModReport } from "../../lib/modlog/report";
import Server from "../../lib/server";

export default class ProposeModRequest implements ComponentInteractionHandler {
  name = "proposeModRequest";

  async handle(event: ButtonInteraction): Promise<void> {
    const server = new Server(event.guild);
    const tag = server.tagbag.tag("modrequest:" + event.message.interaction.id);
    const data: ModReport = tag.get();

    await server.logModlogEvent(new ReportModlogEvent(data));

    event.update({
      content:
        "Se ha enviado una alerta a los destinatarios correspondientes. ¡Muchas gracias por cooperar!",
      components: [],
    });
  }
}
