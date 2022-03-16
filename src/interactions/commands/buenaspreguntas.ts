import { CommandInteraction, MessageEmbedOptions } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { SlashCommandBuilder, userMention } from "@discordjs/builders";

const ANONYMOUS_GREETING = "¡Buenas! 👋";

const MENTION_GREETING = "¡Buenas, $USER$! 👋";

const TEXT = [
  "Alguien ha considerado que tu mensaje parece pedir ayuda, pero que no es",
  "todo lo preciso que podría ser. Si tu pregunta es ignorada, podrías aplicar",
  "estos consejos cuando preguntes cosas por Discord.",
  "(Te recordamos, de hecho, que en las #reglas tienes esta explicación, y que",
  "los moderadores podrían borrar mensajes que parezcan preguntas pero no cuenten",
  "nada.)",
].join(" ");

const embed: MessageEmbedOptions = {
  description: [
    "**Consejos para hacer preguntas:**",
    "• Cuenta directamente qué pasa, no esperes a atraer la atención de nadie.",
    "• Explica qué has intentado ya, para poder saltarse las respuestas fáciles.",
    "",
    "**Enlaces útiles:**",
    "• [¿Cómo elaboro una buena pregunta?](https://es.stackoverflow.com/help/how-to-ask)",
    "• [No pidas permiso para preguntar, sólo pregunta](https://dontasktoask.com/es/)",
    "• [no hello: por favor, no digas sólo hola en el chat](https://nohello.net/)",
  ].join("\n"),
};

export default class PreguntasCommand implements CommandInteractionHandler {
  name = "pregunta";

  build() {
    return new SlashCommandBuilder()
      .setName("pregunta")
      .setDescription("Lanza un recordatorio amistoso para invitar a preguntar mejor")
      .addUserOption((option) => option.setName("cuenta").setDescription("A quién le recordamos"));
  }

  async handle(event: CommandInteraction): Promise<void> {
    /* Check if there is someone to mention. */
    const mentioned: string | null = event.options.get("cuenta", false)?.value as string;
    if (mentioned) {
      const message = `${MENTION_GREETING.replace("$USER$", userMention(mentioned))} ${TEXT}`;
      return event.reply({ content: message, embeds: [embed] });
    } else {
      const message = `${ANONYMOUS_GREETING} ${TEXT}`;
      return event.reply({ content: message, embeds: [embed] });
    }
  }
}
