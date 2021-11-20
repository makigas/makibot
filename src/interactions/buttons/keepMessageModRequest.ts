import { ButtonInteraction } from "discord.js";
import { ButtonInteractionHandler } from "../../lib/interaction";

export default class CancelModRequest implements ButtonInteractionHandler {
  name = "keepMessageModRequest";

  async handle(event: ButtonInteraction): Promise<void> {
    await event.update({
      content: "Mantendremos el mensaje. ¡Hemos terminado!",
      components: [],
    });
  }
}
