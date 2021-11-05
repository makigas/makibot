import type { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { createKarmaToast } from "../../lib/karma";
import Member from "../../lib/member";
import Server from "../../lib/server";

export default class KarmaCommand implements CommandInteractionHandler {
  name = "karma";

  async handle(command: CommandInteraction): Promise<void> {
    if (command.inGuild()) {
      await command.deferReply({ ephemeral: true });

      const server = new Server(command.guild);
      const member = await server.member(command.user);
      const toast = await createKarmaToast(member, member.moderator);
      await command.editReply({ embeds: [toast] });
    }
  }
}
