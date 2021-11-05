import { ButtonInteraction, MessageButton } from "discord.js";
import { ComponentInteractionHandler } from "../../lib/interaction";
import { createToast } from "../../lib/response";

const TEXT = `
El sistema karma controla tu reputación en este servidor. La reputación es una forma de verificar tu cuenta, comprobando que es segura y activa. A cambio, desbloqueas funciones adicionales en el servidor.

**¿Cómo incremento mi reputación?**
- Enviando mensajes en este servidor.
- Recibiendo reacciones ❤️ o 👍 en tus mensajes.
- Recibiendo la reacción 👋 en el canal #presentaciones.
- Recibiendo propinas mediante el comando /propina.

La reputación también puede bajar con la reacción 👎.

Te recomendamos que ante un mensaje valioso, reacciones con ❤️ o 👍 como agradecimiento. Los mensajes poco constructivos o perjudiciales también pueden ser penados con un 👎; pero, por favor, no lo uses si solamente no estás de acuerdo con una opinión.

Ah, y por si te lo estás preguntando: no, reaccionar a tus mensajes no tiene ningún efecto.

**Propinas (bounties)**
Con el comando \`/propina\` puedes regalar parte de tu karma a otra persona. Por si quieres agradecer la ayuda que te han podido prestar.

**Niveles**
Con suficiente reputación se puede subir de nivel. En función de tu nivel, te asignará un rol de reputación:

🔵 Legendarios: Nivel 40+
🟢 Veteranos: Nivel 10+
🟡 Habituales: Nivel 5+
🟣 Interesados: Nivel 2+

Estos roles te permiten desbloquear funciones extra en el servidor, reservadas a las cuentas verificadas, y quizás en el futuro también permita otro tipo de sorpresas.
`;

export function getExplainButton(): MessageButton {
  return new MessageButton({
    customId: "karma_explain_button",
    label: "¿Cómo funciona el karma?",
    style: "SECONDARY",
    emoji: "❓",
  });
}

export default class KarmaButton implements ComponentInteractionHandler {
  name = "karma_explain_button";

  async handle(event: ButtonInteraction): Promise<void> {
    const toast = createToast({
      title: "¿Cómo funciona el sistema karma?",
      description: TEXT,
      severity: "info",
    });
    await event.reply({
      embeds: [toast],
      ephemeral: true,
    });
  }
}
