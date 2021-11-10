import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { createToast } from "../../lib/response";

/**
 * Renames a thread, as long as the thread was opened for a message of yours.
 * For instance, if the bot opens a thread on a message that I've sent, using
 * the `linkchannel` or the `threadchannel` hooks, it will have an ugly name.
 * Or maybe I don't like the name used by someone when opened a thread on top
 * of my message.
 */
export default class RenombrarCommand implements CommandInteractionHandler {
  name = "renombrar";

  async handle(event: CommandInteraction): Promise<void> {
    if (event.channel.isThread()) {
      const message = await event.channel.fetchStarterMessage();
      if (event.channel.ownerId === event.user.id || event.user.id === message.author.id) {
        const newName = event.options.getString("titulo", true);
        await event.channel.setName(newName, "Pedido mediante el comando /renombrar");
        return event.reply({ embeds: [RENAMED], ephemeral: true });
      } else {
        return event.reply({ embeds: [EXCUSE_NOT_YOUR_THREAD], ephemeral: true });
      }
    } else {
      return event.reply({ embeds: [EXCUSE_NON_THREAD], ephemeral: true });
    }
  }
}

const RENAMED = createToast({
  title: "Hilo renombrado correctamente.",
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
