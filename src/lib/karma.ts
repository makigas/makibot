import { GuildMember, MessageEmbed } from "discord.js";
import Member, { KarmaStats } from "./member";
import { createToast } from "./response";

export function canReceivePoints(gm: GuildMember): boolean {
  return gm && !gm.user.bot;
}

export function getLevelV1(points: number): number {
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

/* A memoization to store the computed XP points for levels. */
const memoLevels: { [level: string]: number } = {};

/**
 * Returns the amount of points required to go to a specific level.
 */
export function getPointsForLevelV2(level: number): number {
  const offset = 30;
  const mult = 200;
  if (!memoLevels[level]) {
    memoLevels[level] = Math.ceil(offset * Math.pow(level - 1, 1 + level / mult));
  }
  return memoLevels[level];
}

export function getLevelV2(points: number): number {
  /*
   * Formula:  XP = OFFT * (LVL-1)^(1 + LVL/MULT)
   * Where: OFFT = 30 and MULT = 200
   *
   * Rationale: KarmaV2 alters the offset (goes down from 50 to 30)
   * and also changes the exponent so that it is higher once the
   * level goes up.
   *
   * Screw inverse formulas, this formula is so complex that I prefer
   * to build a loop that iterates until the desired level gets
   * computed.
   */
  if (points === 0) {
    return 0;
  } else if (points < 0) {
    return -1 * getLevelV2(-points);
  }

  let pts,
    level = 0;
  do {
    level++;
    pts = getPointsForLevelV2(level);
  } while (pts <= points);

  return level - 1;
}

function getKarmaPrivileges(stats: KarmaStats): string {
  const boolToEmoji = (bool: boolean) => bool ? "✅" : "❌";
  const privileges: [name: string, status: boolean][] = [
    ["Envío de mensajes (requiere nivel 0)", stats.level >= 0],
    ["Confianza del sistema antispam (requiere nivel 2)", stats.level >= 2],
    ["Enviar mensajes en #hice-esto (requiere nivel 2)", stats.level >= 2],
    ["Enviar enlaces a #enlaces (requiere nivel 5)", stats.level >= 5],
  ];
  return "**Privilegios**:\n" + privileges.map(([name, status]) => `${boolToEmoji(status)} ${name}`).join('\n');
}

export async function createKarmaToast(member: Member, sudo = false): Promise<MessageEmbed> {
  const stats = await member.getKarma();
  const nextLevel = getPointsForLevelV2(stats.level + 1);

  const baseStats = [
    `**🪙 Puntos**: ${stats.points}`,
    `**🏅 Nivel**: ${stats.level}`,
    `**🔜 Próximo nivel en**: ${nextLevel - stats.points}`,
  ].join('\n');

  const sudoStats = [
    "**Modo depuración**",
    `**💬 Mensajes**: ${stats.messages}`,
    `**⏩ Offset**: ${stats.offset}`,
    `**Reacciones**: ` + [
      `👍 ${stats.upvotes}`,
      `👎 ${stats.downvotes}`,
      `⭐ ${stats.stars}`,
      `❤️ ${stats.hearts}`,
      `👋 ${stats.waves}`,
    ].join(" / "),
  ].join('\n');

  const privileges = getKarmaPrivileges(stats);

  const description = [
    baseStats,
    sudo && sudoStats,
    privileges,
  ].filter(Boolean).join('\n\n');

  return createToast({
    title: `Reputación de @${member.user.username}`,
    target: member.user,
    severity: "info",
    description,
  });
}