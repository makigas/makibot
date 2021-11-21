import { ButtonInteraction } from "discord.js";
import { ButtonInteractionHandler } from "../../lib/interaction";
import { createRolesMessage } from "../../lib/makigas/roles";

export default class RolesButton implements ButtonInteractionHandler {
  name = "roles_button";

  async handle(event: ButtonInteraction): Promise<void> {
    const member = await event.guild.members.fetch(event.user.id);
    const message = await createRolesMessage(member);
    await event.reply({
      ...message,
      ephemeral: true,
    });
  }
}
