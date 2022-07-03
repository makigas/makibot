import { ButtonInteraction } from "discord.js";
import { ButtonInteractionHandler } from "../../lib/interaction";
import { handleKarmaInteraction } from "../../lib/karma/interaction";

export default class KarmaButton implements ButtonInteractionHandler {
  name = "karma_button";

  async handleGuild(event: ButtonInteraction): Promise<void> {
    return handleKarmaInteraction(event, event.user.id);
  }
}
