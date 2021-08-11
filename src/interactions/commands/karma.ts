import InteractionCommand from "../../lib/interaction/basecommand";
import Server from "../../lib/server";
import { getPointsForLevelV2 } from "../../lib/karma";
import { createToast } from "../../lib/response";

/*
  {
    "name": "karma",
    "description": "Muestra el nivel de karma",
  }
*/
export default class KarmaCommand extends InteractionCommand<{}> {
  name = "karma";

  async handle(): Promise<void> {
    const guild = this.client.guilds.cache.get(this.event.guild_id);
    const server = new Server(guild);
    const member = await server.member(this.event.member.user.id);

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

    this.sendResponse({ embed: toast, ephemeral: true });
  }
}
