import { ButtonInteraction, GuildMember } from "discord.js";
import { ButtonInteractionHandler } from "../../lib/interaction";
import { tokenToDate } from "datetoken";
import { time } from "@discordjs/builders";
import Makibot from "../../Makibot";
import { createToast } from "../../lib/response";
import Member from "../../lib/member";
import Server from "../../lib/server";
import { getLevelV2 } from "../../lib/karma";

async function syncLevel(gm: GuildMember) {
  const member = new Member(gm);
  const server = new Server(gm.guild);
  const karma = await member.getKarma();
  const expectedLevel = getLevelV2(karma.points);

  // Check if the account has leveled up.
  const currentLevelTag = member.tagbag.tag("karma:level");
  const currentLevel = await currentLevelTag.get(0);
  if (currentLevel != expectedLevel) {
    await currentLevelTag.set(expectedLevel);
    await member.setCrew(expectedLevel);

    // Check if the account has reached this level for the first time.
    const highScoreTag = member.tagbag.tag("karma:max");
    const highScoreValue = await highScoreTag.get(0);
    if (highScoreValue < expectedLevel) {
      await highScoreTag.set(expectedLevel);
    }
  }
}

export default class LootButton implements ButtonInteractionHandler {
  name = "loot";

  async handleGuild(event: ButtonInteraction): Promise<void> {
    const client = event.client as Makibot;
    const database = client.karma;

    const nextDay = tokenToDate("now+d/d");
    if (await database.lootedToday(event.guild.id, event.user.id)) {
      await event.reply({
        embeds: [
          createToast({
            title: "No tan deprisa",
            description: `Sólo puedes usar este comando una vez por día. Se reseteará en ${time(
              nextDay,
              "R"
            )}, a las ${time(nextDay)}`,
            severity: "warning",
          }),
        ],
        ephemeral: true,
      });
    } else {
      await event.deferReply({ ephemeral: true });
      const points = await database.loot(event.id, event.guild.id, event.user.id);
      const member = await event.guild.members.fetch(event.user.id);
      await syncLevel(member);
      await event.editReply({
        embeds: [
          createToast({
            title: "Bonificación desbloqueada",
            description: [
              `Has desbloqueado una bonificación y obtenido ${points}. Regresa mañana`,
              `para obtener una bonificación adicional.\n\n`,
              `El contador se reinicia dentro de ${time(nextDay, "R")}, a las ${time(nextDay)}.`,
            ].join(" "),
          }),
        ],
      });
    }
  }
}
