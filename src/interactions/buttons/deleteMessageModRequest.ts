import { ButtonInteraction, TextBasedChannels } from "discord.js";
import { ComponentInteractionHandler } from "../../lib/interaction";
import { ModReport } from "../../lib/modlog/report";
import Server from "../../lib/server";
import applyWastebin from "../../lib/wastebin";

export default class CancelModRequest implements ComponentInteractionHandler {
  name = "deleteMessageModRequest";

  async handle(event: ButtonInteraction): Promise<void> {
    const server = new Server(event.guild);
    const tag = server.tagbag.tag("modrequest:" + event.message.interaction.id);
    const data: ModReport = tag.get();

    const channel = await event.guild.channels.fetch(data.report.channel);
    const message = await (channel as TextBasedChannels).messages.fetch(data.message.id);

    await applyWastebin(message);

    await event.update({
      content: "El mensaje ha sido eliminado. ¡Hemos terminado!",
      components: [],
    });
  }
}
