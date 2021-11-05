import { ButtonInteraction } from "discord.js";
import { ComponentInteractionHandler } from "../../lib/interaction";
import { createKarmaToast } from "../../lib/karma";
import Member from "../../lib/member";

export default class KarmaButton implements ComponentInteractionHandler {
  name = "karma_button";

  async handle(event: ButtonInteraction): Promise<void> {
    const guildMember = await event.guild.members.fetch(event.user.id);
    const member = new Member(guildMember);
    const toast = await createKarmaToast(member, member.moderator);
    await event.reply({
      embeds: [toast],
      ephemeral: true,
    });
  }
}
