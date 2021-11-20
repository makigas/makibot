import { ButtonInteraction, MessageActionRow } from "discord.js";
import { ButtonInteractionHandler } from "../../lib/interaction";
import { createKarmaToast } from "../../lib/karma";
import Member from "../../lib/member";
import { getExplainButton } from "./karmaExplain";

export default class KarmaButton implements ButtonInteractionHandler {
  name = "karma_button";

  async handle(event: ButtonInteraction): Promise<void> {
    const guildMember = await event.guild.members.fetch(event.user.id);
    const member = new Member(guildMember);
    const toast = await createKarmaToast(member, member.moderator);
    await event.reply({
      embeds: [toast],
      components: [
        new MessageActionRow({
          components: [getExplainButton()],
        }),
      ],
      ephemeral: true,
    });
  }
}
