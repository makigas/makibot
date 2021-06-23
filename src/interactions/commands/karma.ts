import InteractionCommand from "../../lib/interaction/basecommand";
import Server from "../../lib/server";

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

    const kinds = [
      `👍 ${stats.upvotes}`,
      `👎 ${stats.downvotes}`,
      `⭐ ${stats.stars}`,
      `❤️ ${stats.hearts}`,
      `👋 ${stats.waves}`,
    ];
    const response =
      `🪙 Karma: ${stats.points}        🏅 Nivel: ${stats.level}\n` +
      `  💬 Mensajes: ${stats.messages}        ⏩ Offset: ${stats.offset}\n` +
      `  ${kinds.join("    ")}`;

    this.sendResponse(response, true);
  }
}
