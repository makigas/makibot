import { ButtonInteraction } from "discord.js";
import { ButtonInteractionHandler } from "../../lib/interaction";
import { ReportModlogEvent } from "../../lib/modlog";
import { ModReport } from "../../lib/modlog/report";
import Server from "../../lib/server";

export default class ProposeModRequest implements ButtonInteractionHandler {
  name = "proposeModRequest";

  async handle(event: ButtonInteraction): Promise<void> {
    const server = new Server(event.guild);
    const tag = server.tagbag.tag("modrequest:" + event.message.interaction.id);
    const data: ModReport = tag.get();

    if (data.interaction.alert[0] === "mods") {
      await server.logModlogEvent(new ReportModlogEvent(data));
    } else if (data.interaction.alert[0] === "admin") {
      await server.logSensibleModlogEvent(new ReportModlogEvent(data));
    }

    event.update({
      content:
        "Se ha enviado una alerta a los destinatarios correspondientes. ¡Muchas gracias por cooperar!",
      components: [],
    });
  }
}
