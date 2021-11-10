import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { createToast } from "../../lib/response";

/**
 * Archives a thread, as long as the thread was opened by me, or the thread was
 * started on top of a message of mine. This is useful when the bot starts
 * automatically a thread using the linkchannel or threadchannel hook, or
 * whenver someone opens a thread and it gets replied quickly.
 */
export default class ArchivarCommand implements CommandInteractionHandler {
  name = "archivar";

  async handle(event: CommandInteraction): Promise<void> {
    if (event.channel.isThread()) {
      const message = await event.channel.fetchStarterMessage();
      if (event.channel.ownerId === event.user.id || event.user.id === message.author.id) {
        await event.reply({ embeds: [ARCHIVED], ephemeral: true });
        await event.channel.setArchived(true, "Pedido mediante el comando /archivar");
      } else {
        return event.reply({ embeds: [EXCUSE_NOT_YOUR_THREAD], ephemeral: true });
      }
    } else {
      return event.reply({ embeds: [EXCUSE_NON_THREAD], ephemeral: true });
    }
  }
}

const ARCHIVED = createToast({
  title: "El hilo se archivará.",
  severity: "success",
});

const EXCUSE_NON_THREAD = createToast({
  title: "Este comando sólo puede ser usado dentro de un hilo.",
  severity: "error",
});

const EXCUSE_NOT_YOUR_THREAD = createToast({
  title: "Este comando sólo puede ser usado en un hilos abiertos a partir de tu mensaje.",
  severity: "error",
});
