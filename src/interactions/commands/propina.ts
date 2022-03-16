import { CommandInteraction, MessageEmbed, TextChannel } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { getLevelV2 } from "../../lib/karma";

import Member from "../../lib/member";
import { createToast } from "../../lib/response";
import Server from "../../lib/server";
import Makibot from "../../Makibot";

const MAX_BOUNTY_PER_DAY = 300;

function validatesUsers(origin: Member, target: Member): MessageEmbed | null {
  if (target.user.bot) {
    return createToast({
      title: `@${target.user.username} no acepta karma`,
      description:
        "Ese perfil está excluido del sistema karma por lo que no se le puede entregar propinas.",
      severity: "error",
    });
  } else if (target.id === origin.id) {
    return createToast({
      title: "Karma entregado correctamente",
      description: "Sí, claro, te has entregado karma a ti mismo. ¡Bieeeeeeen! En serio...",
      severity: "error",
    });
  }
  return null;
}

function validatesAmount(amount: number): MessageEmbed | null {
  if (amount < 0) {
    return createToast({
      title: "No se puede entregar esta cantidad de karma",
      description: "Has escrito una cantidad negativa. Así no se puede.",
      severity: "error",
    });
  } else if (amount === 0) {
    return createToast({
      title: "No se puede entregar esta cantidad de karma",
      description: "Has especificado 0 como cantidad. No me hagas perder mi tiempo",
      severity: "error",
    });
  }
  return null;
}

async function checkMemberLevel(member: Member): Promise<void> {
  const currentLevelTag = member.tagbag.tag("karma:level");
  const currentLevel = await currentLevelTag.get(0);
  await member.setCrew(currentLevel);
}

async function assertLevel(member: Member, channel: TextChannel): Promise<void> {
  const karma = await member.getKarma();

  /* If an account reaches a very low reputation level, should be muted. */
  if (karma.points <= -3) {
    return this.muteLowReputation(member);
  }

  const currentLevelTag = member.tagbag.tag("karma:level");
  const expectedLevel = getLevelV2(karma.points);
  const currentLevel = await currentLevelTag.get(0);
  if (currentLevel != expectedLevel) {
    await currentLevelTag.set(expectedLevel);

    const highScoreTag = member.tagbag.tag("karma:max");
    const highScoreValue = await highScoreTag.get(0);
    if (highScoreValue < expectedLevel) {
      await highScoreTag.set(expectedLevel);
      if (expectedLevel === 1) {
        /* First message. */
        const toast = createToast({
          title: `¡Es el primer mensaje de @${member.user.username}!`,
          description: [
            `¡Ey! Este es el primer mensaje de @${member.user.username} en este servidor.`,
            "¡Te damos la bienvenida, esperamos que estés bien y te damos las gracias por",
            "participar en este servidor!",
          ].join(" "),
          severity: "success",
          target: member.user,
        });
        await channel.send({ embeds: [toast] });
      } else {
        const toast = createToast({
          title: `¡@${member.user.username} ha subido al nivel ${expectedLevel}!`,
          severity: "success",
          target: member.user,
        });
        await channel.send({ embeds: [toast] });
      }
    }
  }

  // Always do this, even if the level does not change, in case the user
  // has lost the color for some reason or mistake in the server.
  await checkMemberLevel(member);
}

async function handleGuildCommand(command: CommandInteraction): Promise<void> {
  const client = command.client as Makibot;
  const server = new Server(command.guild);

  const targetSnowflake = String(command.options.get("target", true).value);
  const targetMember = await server.member(targetSnowflake);
  const originMember = await server.member(command.user);

  const userValidation = validatesUsers(originMember, targetMember);
  if (userValidation) {
    return command.reply({ embeds: [userValidation], ephemeral: true });
  }

  const amount = command.options.getInteger("valor", true);
  const amountValidation = validatesAmount(amount);
  if (amountValidation) {
    return command.reply({ embeds: [amountValidation], ephemeral: true });
  }

  const karma = await originMember.getKarma();
  const sentToday = await client.karma.bountiesSentToday(originMember.id);
  const receivedToday = await client.karma.bountiesReceivedToday(targetMember.id);

  if (karma.points <= amount) {
    return command.reply({
      embeds: [
        createToast({
          title: "No se puede entregar esta cantidad de karma",
          description:
            "No tienes suficiente karma como para entregar esto. Utiliza /karma para ver tu cantidad actual.",
          severity: "error",
        }),
      ],
      ephemeral: true,
    });
  } else if (MAX_BOUNTY_PER_DAY - (sentToday + amount) < 0) {
    return command.reply({
      embeds: [
        createToast({
          title: "No se puede entregar esta cantidad de karma",
          description: [
            `No puedes enviar más de ${MAX_BOUNTY_PER_DAY} puntos por día.`,
            `Parece que estás intentando enviar demasiados puntos en este momento.`,
            `Intenta con un valor menor o prueba mañana.`,
          ].join(" "),
          severity: "error",
        }),
      ],
      ephemeral: true,
    });
  } else if (MAX_BOUNTY_PER_DAY - (receivedToday + amount) < 0) {
    return command.reply({
      embeds: [
        createToast({
          title: "No se puede entregar esta cantidad de karma",
          description: [
            `No puedes recibir más de ${MAX_BOUNTY_PER_DAY} puntos por día.`,
            `Parece que esta persona estaría aceptando demasiado karma por hoy`,
            `Intenta con un valor menor o prueba mañana.`,
          ].join(" "),
          severity: "error",
        }),
      ],
      ephemeral: true,
    });
  }

  /* Valid, proceed with the donation. */
  await client.karma.bounty(command.id, originMember.id, targetMember.id, amount);
  assertLevel(targetMember, command.channel as TextChannel);
  return command.reply({
    embeds: [
      createToast({
        title: `¡@${originMember.user.username} ha enviado una propina a @${targetMember.user.username}!`,
        description: `${amount} ${
          amount == 1 ? "punto ha sido añadido" : "puntos han sido añadidos"
        } a la reputación de ${targetMember.user.username}.`,
        severity: "success",
        target: targetMember.user,
      }),
    ],
  });
}

export default class PropinaCommand implements CommandInteractionHandler {
  name = "propina";

  async handle(command: CommandInteraction): Promise<void> {
    if (command.inGuild()) {
      return handleGuildCommand(command);
    } else {
      // TODO: https://github.com/discordjs/discord.js/issues/6126
      return (command as CommandInteraction).reply({
        embeds: [
          createToast({
            title: `Este comando sólo se puede usar en un servidor`,
            severity: "error",
          }),
        ],
        ephemeral: true,
      });
    }
  }
}
