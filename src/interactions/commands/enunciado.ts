import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { userMention } from "@discordjs/builders";

const ANONYMOUS_GREETING = "¡Buenas! 👋";

const MENTION_GREETING = "¡Buenas, $USER$! 👋";

const TEXT = [
  "Estoy aquí para recordar que en este servidor está prohibido adjuntar",
  "capturas de pantalla o textos literales de enunciados. Pedir que te",
  "resolvamos la tarea o el examen es una falta de respeto. Borra o cae ban.",
  "(Esto lo contaban las #reglas que en teoría hay que leer para publicar)",
].join(" ");

export default class EnunciadoCommand implements CommandInteractionHandler {
  name = "enunciado";

  async handle(event: CommandInteraction): Promise<void> {
    /* Check if there is someone to mention. */
    const mentioned: string | null = event.options.get("cuenta", false)?.value as string;
    if (mentioned) {
      const message = `${MENTION_GREETING.replace("$USER$", userMention(mentioned))} ${TEXT}`;
      return event.reply(message);
    } else {
      const message = `${ANONYMOUS_GREETING} ${TEXT}`;
      return event.reply(message);
    }
  }
}
