import { ButtonInteraction } from "discord.js";
import { ButtonInteractionHandler } from "../../lib/interaction";
import { startRoleManager } from "../../lib/makigas/roles";

export default class RolesButton implements ButtonInteractionHandler {
  name = "roles_button";

  async handleGuild(event: ButtonInteraction): Promise<void> {
    return startRoleManager(event);
  }
}
