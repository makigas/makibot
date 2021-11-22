import {
  BaseCommandInteraction,
  ButtonInteraction,
  InteractionCollector,
  MessageActionRow,
  MessageActionRowOptions,
  MessageComponentInteraction,
  MessageEmbed,
  Snowflake,
} from "discord.js";
import { getPointsForLevelV2 } from "../karma";
import Member, { KarmaStats } from "../member";
import { createToast } from "../response";
import Server from "../server";

const EXPLAIN_TEXT = `
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

function getKarmaPrivileges(stats: KarmaStats): string {
  const boolToEmoji = (bool: boolean) => (bool ? "✅" : "❌");
  const privileges: [name: string, status: boolean][] = [
    ["Envío de mensajes (requiere nivel 0)", stats.level >= 0],
    ["Confianza del sistema antispam (requiere nivel 2)", stats.level >= 2],
    ["Enviar mensajes en #hice-esto (requiere nivel 2)", stats.level >= 2],
    ["Enviar enlaces a #enlaces (requiere nivel 5)", stats.level >= 5],
  ];
  return (
    "**Privilegios**:\n" +
    privileges.map(([name, status]) => `${boolToEmoji(status)} ${name}`).join("\n")
  );
}

async function createKarmaToast(member: Member, sudo = false): Promise<MessageEmbed> {
  const stats = await member.getKarma();
  const nextLevel = getPointsForLevelV2(stats.level + 1);

  const baseStats = [
    `**🪙 Puntos**: ${stats.points}`,
    `**🏅 Nivel**: ${stats.level}`,
    `**🔜 Próximo nivel en**: ${nextLevel - stats.points}`,
  ].join("\n");

  const sudoStats = [
    "**Modo depuración**",
    `**💬 Mensajes**: ${stats.messages}`,
    `**⏩ Offset**: ${stats.offset}`,
    `**Reacciones**: ` +
      [
        `👍 ${stats.upvotes}`,
        `👎 ${stats.downvotes}`,
        `⭐ ${stats.stars}`,
        `❤️ ${stats.hearts}`,
        `👋 ${stats.waves}`,
      ].join(" / "),
  ].join("\n");

  const privileges = getKarmaPrivileges(stats);

  const description = [baseStats, sudo && sudoStats, privileges].filter(Boolean).join("\n\n");

  return createToast({
    title: `Reputación de @${member.user.username}`,
    target: member.user,
    severity: "info",
    description,
  });
}

const KARMA_INTERACTION_ACTION_ROW: MessageActionRowOptions = {
  type: "ACTION_ROW",
  components: [
    {
      type: "BUTTON",
      customId: "karma:explain",
      label: "¿Cómo funciona el karma?",
      style: "SECONDARY",
      emoji: "❓",
    },
  ],
};

function createInteractionCollector(
  interaction: BaseCommandInteraction | MessageComponentInteraction,
  parentId: Snowflake
): InteractionCollector<ButtonInteraction> {
  const collector = interaction.channel.createMessageComponentCollector({
    componentType: "BUTTON",
    filter: (btn) => btn.customId === "karma:explain" && btn.message.id === parentId,
  });
  collector.on("collect", (event) => {
    event.reply({
      embeds: [
        createToast({
          title: "¿Cómo funciona el sistema karma?",
          description: EXPLAIN_TEXT,
          severity: "info",
        }),
      ],
      ephemeral: true,
    });
  });
  return collector;
}

export async function handleKarmaInteraction(
  interaction: BaseCommandInteraction | MessageComponentInteraction,
  target: Snowflake
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const server = new Server(interaction.guild);
  const member = await server.member(target);
  const dispatcher = await server.member(interaction.member.user.id);

  /* You cannot get the karma for a bot. */
  if (member.user.bot) {
    const toast = createToast({
      title: `Balance de karma de @${member.user.username}`,
      description: "Este usuario es un bot y no tiene karma",
      severity: "error",
    });
    await interaction.editReply({
      embeds: [toast],
    });
    return;
  }

  const report = await createKarmaToast(member, dispatcher.moderator);
  const message = await interaction.editReply({
    embeds: [report],
    components: [new MessageActionRow(KARMA_INTERACTION_ACTION_ROW)],
  });
  createInteractionCollector(interaction, message.id);
}
