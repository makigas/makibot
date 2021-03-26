import { GuildMember, Snowflake } from "discord.js";
import Member from "./member";

export function canReceivePoints(gm: GuildMember): boolean {
  if (!gm) {
    return false;
  }
  const member = new Member(gm);
  return !gm.user.bot && member.verified;
}

export function getLevelUpMessage(id: Snowflake, level: number): string {
  switch (level) {
    case 1:
      return `¡Te damos la bienvenida, <@${id}>! Este servidor es mejor ahora que estás aquí. Has publicado tu primer mensaje y por eso has subido a Nivel 1. Interactúa en este servidor para subir de nivel y desbloquear funciones nuevas.`;
    default:
      return `¡Enhorabuena, <@${id}>, has alcanzado el Nivel ${level}`;
  }
}

export function getLevel(points: number): number {
  /*
   * Considerations:
   * - Always add 1 because it is not possible to have level 0, you always start from level 1.
   * - Formulas in use:    xp = 50 * (level ^ 1.25)
   *                 => level = (xp / 50) ^ (1/1.25)
   */
  /* Always add 1 because members should start in level 1. */
  if (points < 0) {
    /*
     * If points is negative, you can't do a root of a negative number.
     * Tweak this by inverting the sign of inputs and outputs.
     */
    const progress = -1 * Math.pow(-points / 50, 1 / 1.25);
    return Math.trunc(progress) - 1;
  } else if (points == 0) {
    /* Except that now I need a whole case for zero! :( */
    return 0;
  } else {
    const progress = Math.pow(points / 50, 1 / 1.25);
    return Math.trunc(progress) + 1;
  }
}
