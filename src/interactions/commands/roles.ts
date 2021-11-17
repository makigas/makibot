import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { createRolesMessage } from "../../lib/makigas/roles";

export default class RolesCommand implements CommandInteractionHandler {
  name = "roles";

  async handle(event: CommandInteraction): Promise<void> {
    const member = await event.guild.members.fetch(event.user.id);
    const message = await createRolesMessage(member);
    await event.reply({
      ...message,
      ephemeral: true,
    });
  }
}
