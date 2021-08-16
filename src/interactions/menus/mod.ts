import { CommandInteraction } from "discord.js";
import type { CommandInteractionHandler } from "../../lib/interaction";
import { createModReport, ModReport, renderMenuComponents } from "../../lib/modlog/report";
import { createToast } from "../../lib/response";
import Server from "../../lib/server";

export default class ModRequestCommand implements CommandInteractionHandler {
  name = "Aplicar o pedir moderación";

  async handle(event: CommandInteraction): Promise<void> {
    await event.deferReply({
      ephemeral: true,
    });
    if (!event.inGuild()) {
      const toast = createToast({
        title: "Este comando no puede usarse fuera de un servidor",
        severity: "error",
      });
      await (event as CommandInteraction).editReply({
        embeds: [toast],
      });
      return;
    }

    const server = new Server(event.guild);
    const member = await server.member(event.user);

    const message = event.options.getMessage("message", true);
    if (member.id === message.author.id) {
      const toast = createToast({
        title: "No puedes reportar este mensaje",
        description: "No puedes reportar un mensaje que has escrito tú.",
        severity: "error",
      });
      await event.editReply({ embeds: [toast] });
      return;
    }

    const targetMember = await server.member(message.author.id);
    if (targetMember.moderator) {
      const toast = createToast({
        title: "No puedes reportar este mensaje",
        description: "No puedes reportar un mensaje enviado por un mod.",
        severity: "error",
      });
      await event.editReply({ embeds: [toast] });
      return;
    }
    if (targetMember.user.bot) {
      const toast = createToast({
        title: "No puedes reportar este mensaje",
        description: "No puedo reportar mensajes publicados por bots.",
        severity: "error",
      });
      await event.editReply({ embeds: [toast] });
      return;
    }

    if (member.moderator) {
      /* Create a tagpoint to remember about this message. */
      const tag = server.tagbag.tag("modrequest:" + event.id);
      const data = createModReport(event);
      await tag.set(data);

      /* Moderators can moderate. */
      await event.editReply({
        content: "Aplicar acción de moderación a este mensaje.",
        components: renderMenuComponents(data),
      });
    } else {
      // TODO
      const toast = createToast({
        title: "Todavía no es posible 🙏",
        description:
          "Pronto podrás reportar este mensaje usando este comando, pero por ahora no es posible.",
        severity: "warning",
      });
      await event.editReply({ embeds: [toast] });
    }
  }
}
