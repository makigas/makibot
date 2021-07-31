import { Guild, GuildMember } from "discord.js";
import InteractionCommand from "../../lib/interaction/basecommand";
import Server from "../../lib/server";
import { createToast } from "../../lib/response";

interface PropinaParams {
  target: GuildMember;
  valor: number;
}

const MAX_BOUNTY_PER_DAY = 300;

export default class PropinaCommand extends InteractionCommand<PropinaParams> {
  name = "propina";

  respondWith(title: string, description: string, error: boolean): Promise<void> {
    const toast = createToast({ title, description, severity: error ? "warning" : "success" });
    return this.sendResponse({ embed: toast, ephemeral: error });
  }

  async handle(guild: Guild, { target, valor }): Promise<void> {
    const server = new Server(guild);
    const targetMember = await server.member(target);
    const originMember = await server.member(this.event.member.user.id);

    const sentToday = await this.client.karma.bountiesSentToday(this.event.member.user.id);
    const receivedToday = await this.client.karma.bountiesReceivedToday(target.id);

    const karma = await originMember.getKarma();
    console.log({ total: karma.total, valor });

    if (targetMember.user.bot) {
      return this.respondWith(
        `@${targetMember.user.username} no acepta karma`,
        "Ese perfil está excluido del sistema karma por lo que no se le puede entregar propinas.",
        true
      );
    } else if (valor < 0) {
      return this.respondWith(
        "No se puede entregar esta cantidad de karma",
        "Has escrito una cantidad negativa. Así no se puede.",
        true
      );
    } else if (valor === 0) {
      return this.respondWith(
        "No se puede entregar esta cantidad de karma",
        "Has especificado 0 como cantidad. No me hagas perder mi tiempo",
        true
      );
    } else if (originMember.id === targetMember.id) {
      return this.respondWith(
        "No se puede entregar esta cantidad de karma",
        "Estás intentando regalarte karma a ti mismo. No me hagas perder mi tiempo",
        true
      );
    } else if (karma.total <= valor) {
      return this.respondWith(
        "No se puede entregar esta cantidad de karma",
        "No tienes suficiente karma como para entregar esto. Utiliza /karma para ver tu cantidad actual.",
        true
      );
    } else if (MAX_BOUNTY_PER_DAY - (sentToday + valor) < 0) {
      return this.respondWith(
        "No se puede entregar esta cantidad de karma",
        [
          `No puedes enviar más de ${MAX_BOUNTY_PER_DAY} puntos por día.`,
          `Parece que estás intentando enviar demasiados puntos en este momento.`,
          `Intenta con un valor menor o prueba mañana.`,
        ].join(" "),
        true
      );
    } else if (MAX_BOUNTY_PER_DAY - (receivedToday + valor) < 0) {
      return this.respondWith(
        "No se puede entregar esta cantidad de karma",
        [
          `No puedes recibir más de ${MAX_BOUNTY_PER_DAY} puntos por día.`,
          `Parece que esta persona estaría aceptando demasiado karma por hoy`,
          `Intenta con un valor menor o prueba mañana.`,
        ].join(" "),
        true
      );
    } else {
      await this.client.karma.bounty(
        this.event.id,
        this.event.member.user.id,
        targetMember.id,
        valor
      );
      return this.respondWith(
        `¡@${this.event.member.user.username} ha enviado una propina a @${targetMember.user.username}!`,
        `${valor} puntos han sido añadidos a la reputación de ${targetMember.user.username}.`,
        false
      );
    }
  }
}
