import type { CommandInteraction, MessageEmbed } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { getPointsForLevelV2 } from "../../lib/karma";
import Member from "../../lib/member";
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

export default class KarmaCommand implements CommandInteractionHandler {
  name = "karma";

  async handle(command: CommandInteraction): Promise<void> {
    if (command.inGuild()) {
      const server = new Server(command.guild);
      const member = await server.member(command.user);
      await command.deferReply({ ephemeral: true });
      const toast = await createKarmaToast(member);
      await command.editReply({ embeds: [toast] });
    }
  }
}
