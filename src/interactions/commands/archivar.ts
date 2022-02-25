import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { createToast } from "../../lib/response";
import Server from "../../lib/server";

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
      if (await canCloseMessage(event)) {
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

async function canCloseMessage(event: CommandInteraction) {
  /*
   * Rules that indicate whether a message can be closed or not. You can close
   * the message if:
   * - You are the person that opened the thread. (Because it is yours.)
   * - You are the person that sent the original message. (Because it is your
   *   message.)
   * - You are mod.
   */
  if (event.channel.isThread()) {
    /* You are the person that opened the thread. */
    if (event.channel.ownerId === event.user.id) {
      return true;
    }

    const message = await event.channel.fetchStarterMessage();

    /* You are the person that sent the original message. */
    if (message.author.id === event.user.id) {
      return true;
    }

    const server = new Server(message.guild);
    const member = await server.member(event.user.id);

    /* You are the moderator of this server. */
    if (member.moderator) {
      return true;
    }
  }

  /* Okay I tried. */
  return false;
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
