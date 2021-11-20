import { MessageComponentInteraction, SelectMenuInteraction } from "discord.js";
import { SelectMenuInteractionHandler } from "../../lib/interaction";
import { ModReport, renderMenuComponents } from "../../lib/modlog/report";
import { createToast } from "../../lib/response";
import Server from "../../lib/server";

export default class ModMenuAlert implements SelectMenuInteractionHandler {
  name = "modmenu_alert";

  async handle(event: SelectMenuInteraction): Promise<void> {
    if (!event.inGuild()) {
      const toast = createToast({
        title: "Este comando no se puede usar fuera de un servidor",
        severity: "error",
      });
      return (event as MessageComponentInteraction).reply({
        embeds: [toast],
        ephemeral: true,
      });
    }

    const server = new Server(event.guild);
    const tag = server.tagbag.tag("modrequest:" + event.message.interaction.id);
    const data: ModReport = tag.get();
    data.interaction.alert = event.values;
    tag.set(data);

    await event.update({
      components: renderMenuComponents(data),
    });
  }
}
