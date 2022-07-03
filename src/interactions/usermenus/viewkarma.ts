import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { UserContextMenuInteraction } from "discord.js";
import type { UserContextMenuInteractionHandler } from "../../lib/interaction";
import { handleKarmaInteraction } from "../../lib/karma/interaction";

export default class ViewKarmaCommand implements UserContextMenuInteractionHandler {
  name = "Ver karma";

  build() {
    return new ContextMenuCommandBuilder().setName("Ver karma").setType(2);
  }

  async handleGuild(event: UserContextMenuInteraction): Promise<void> {
    return handleKarmaInteraction(event, event.targetUser.id);
  }
}
