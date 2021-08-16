import { CommandInteraction } from "discord.js";
import applyWarn from "../../lib/warn";
import { createToast } from "../../lib/response";
import { CommandInteractionHandler } from "../../lib/interaction";
import Server from "../../lib/server";

export default class WarnCommand implements CommandInteractionHandler {
  name = "warn";

  async handle(event: CommandInteraction): Promise<void> {
    if (event.inGuild()) {
      const server = new Server(event.guild);
      const target = String(event.options.get("target", true).value);
      const member = await server.member(target);
      const reason = event.options.getString("reason", false) || null;

      if (member.moderator) {
        const toast = createToast({
          title: "No se puede aplicar un warn",
          description: `@${member.user.username} es un moderador.`,
          target: member.user,
          severity: "error",
        });
        return event.reply({ embeds: [toast], ephemeral: true });
      } else if (member.user.bot) {
        const toast = createToast({
          title: "No se puede aplicar un warn",
          description: `@${member.user.username} es un bot.`,
          target: member.user,
          severity: "error",
        });
        return event.reply({ embeds: [toast], ephemeral: true });
      } else {
        await applyWarn(event.guild, { user: member.user, reason, duration: 86400 * 1000 * 7 });
        const toast = createToast({
          title: "Warn aplicado",
          description: `Le has aplicado un warn a @${member.user.username}`,
          target: member.user,
          severity: "success",
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
