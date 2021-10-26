import { ButtonInteraction } from "discord.js";
import { ComponentInteractionHandler } from "../../lib/interaction";
import { createRolesMessage } from "../../lib/makigas/roles";

export default class RolesButton implements ComponentInteractionHandler {
  name = "roles_button";

  async handle(event: ButtonInteraction): Promise<void> {
    const member = await event.guild.members.fetch(event.user.id);
    const message = await createRolesMessage(member);
    console.log(JSON.stringify(message));
    await event.reply({
      ...message,
      ephemeral: true,
    });
  }
}
