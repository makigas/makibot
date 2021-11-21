import { ButtonInteraction, TextBasedChannels } from "discord.js";
import { ButtonInteractionHandler } from "../../lib/interaction";
import { ModReport } from "../../lib/modlog/report";
import Server from "../../lib/server";

export default class CancelModRequest implements ButtonInteractionHandler {
  name = "deleteMessageModRequest";

  async handle(event: ButtonInteraction): Promise<void> {
    const server = new Server(event.guild);
    const tag = server.tagbag.tag("modrequest:" + event.message.interaction.id);
    const data: ModReport = tag.get();

    const channel = await event.guild.channels.fetch(data.report.channel);
    const message = await (channel as TextBasedChannels).messages.fetch(data.message.id);

    await message.delete();

    await event.update({
      content: "El mensaje ha sido eliminado. ¡Hemos terminado!",
      components: [],
    });
  }
}
