import type { CommandInteraction } from "discord.js";
import type { CommandInteractionHandler } from "../../lib/interaction";
import { createKarmaToast } from "../../lib/karma";
import { createToast } from "../../lib/response";
import Server from "../../lib/server";

export default class ViewKarmaCommand implements CommandInteractionHandler {
  name = "Ver karma";

  async handle(event: CommandInteraction): Promise<void> {
    await event.deferReply({ ephemeral: true });

    const value = String(event.options.get("user").value);
    const server = new Server(event.guild);
    const member = await server.member(value);
    const dispatcher = await server.member(event.member.user.id);

    if (member.user.bot) {
      const toast = createToast({
        title: `Balance de karma de @${member.user.username}`,
        description: "Este usuario es un bot y no tiene karma",
        severity: "error",
      });
      await event.editReply({ embeds: [toast] });
    } else {
      const report = await createKarmaToast(member, dispatcher.moderator);
      await event.editReply({ embeds: [report] });
    }
  }
}
