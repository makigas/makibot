import { ButtonInteraction } from "discord.js";
import { ButtonInteractionHandler } from "../../lib/interaction";
import Server from "../../lib/server";

export default class CancelModRequest implements ButtonInteractionHandler {
  name = "cancelModRequest";

  async handle(event: ButtonInteraction): Promise<void> {
    const server = new Server(event.guild);
    const tag = server.tagbag.tag("modrequest:" + event.message.interaction.id);
    await tag.delete();
    await event.update({
      content: "Has cancelado el envío del reporte de moderación",
      components: [],
    });
  }
}
