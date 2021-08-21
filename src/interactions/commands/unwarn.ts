import { CommandInteraction } from "discord.js";
import Server from "../../lib/server";
import { CommandInteractionHandler } from "../../lib/interaction";
import { removeWarn } from "../../lib/warn";
import { createToast } from "../../lib/response";

export default class UnwarnCommand implements CommandInteractionHandler {
  name = "unwarn";

  async handle(event: CommandInteraction): Promise<void> {
    if (event.inGuild()) {
      const server = new Server(event.guild);
      const target = String(event.options.get("target", true).value);
      const member = await server.member(target);

      if (member.warned) {
        await removeWarn(server, member);
        const toast = createToast({
          title: "Warn retirado",
          description: `Le has retirado el warn a @${member.user.username}`,
          target: member.user,
          severity: "success",
        });
        return event.reply({ embeds: [toast], ephemeral: true });
      } else {
        const toast = createToast({
          title: "Este usuario no tiene warn",
          description: "No se le puede quitar un warn",
          target: member.user,
          severity: "info",
        });
        return event.reply({ embeds: [toast], ephemeral: true });
      }
    } else {
      const toast = createToast({
        title: "Este comando no se puede usar fuera de un servidor",
        severity: "error",
      });
      (event as CommandInteraction).reply({
        embeds: [toast],
        ephemeral: true,
      });
    }
  }
}
