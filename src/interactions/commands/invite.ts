import { CommandInteraction, MessageEmbedOptions } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { userMention } from "@discordjs/builders";

export default class PreguntasCommand implements CommandInteractionHandler {
  name = "invite";

  async handle(event: CommandInteraction): Promise<void> {
    if (process.env.INVITE_TOKEN) {
      return event.reply({
        content: "Invite para makigas https://discord.gg/" + process.env.INVITE_TOKEN,
      });
    } else {
      return event.reply({ content: "Invite vivo: <http://discord.makigas.es>" });
    }
  }
}
