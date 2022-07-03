import { ButtonInteraction } from "discord.js";
import { ButtonInteractionHandler } from "../../lib/interaction";
import { startHelperManager } from "../../lib/makigas/helper";

export default class HelperButton implements ButtonInteractionHandler {
  name = "helper_button";

  async handleGuild(event: ButtonInteraction): Promise<void> {
    return startHelperManager(event);
  }
}
