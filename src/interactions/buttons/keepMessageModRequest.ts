import { ButtonInteraction } from "discord.js";
import { ComponentInteractionHandler } from "../../lib/interaction";

export default class CancelModRequest implements ComponentInteractionHandler {
  name = "keepMessageModRequest";

  async handle(event: ButtonInteraction): Promise<void> {
    await event.update({
      content: "Mantendremos el mensaje. ¡Hemos terminado!",
      components: [],
    });
  }
}
