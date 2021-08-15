import type { CommandInteraction, MessageEmbed } from "discord.js";
import type { CommandInteractionHandler } from "../../lib/interaction";
import type Member from "../../lib/member";
import { getPointsForLevelV2 } from "../../lib/karma";
import { createToast } from "../../lib/response";
import Server from "../../lib/server";

async function createKarmaToast(member: Member): Promise<MessageEmbed> {
  const stats = await member.getKarma();
  const nextLevel = getPointsForLevelV2(stats.level + 1);

  const toast = createToast({
    title: `Balance de karma de @${member.user.username}`,
    target: member.user,
    severity: "info",
  });
  toast.addField("🪙 Karma", String(stats.points), true);
  toast.addField("🏅 Nivel", String(stats.level), true);
  toast.addField("💬 Mensajes", String(stats.messages), true);
  if (stats.offset > 0) {
    toast.addField("⏩ Offset", String(stats.offset), true);
  }
  toast.addField("🔜 Puntos hasta el siguiente nivel", String(nextLevel - stats.points), false);

  const kinds = [
    `👍 ${stats.upvotes}`,
    `👎 ${stats.downvotes}`,
    `⭐ ${stats.stars}`,
    `❤️ ${stats.hearts}`,
    `👋 ${stats.waves}`,
  ].join(" / ");
  toast.addField("Reacciones", kinds, false);

  return toast;
}

export default class ViewKarmaCommand implements CommandInteractionHandler {
  name = "Ver karma";

  async handle(event: CommandInteraction): Promise<void> {
    await event.deferReply({ ephemeral: true });
    const value = String(event.options.get("user").value);
    const server = new Server(event.guild);
    const member = await server.member(value);

    if (member.user.bot) {
      const toast = createToast({
        title: `Balance de karma de @${member.user.username}`,
        description: "Este usuario es un bot y no tiene karma",
        severity: "error",
      });
      await event.editReply({ embeds: [toast] });
    } else {
      const report = await createKarmaToast(member);
      await event.editReply({ embeds: [report] });
    }
  }
}
