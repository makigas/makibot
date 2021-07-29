import { GuildMember } from "discord.js";
import Member from "./member";

export function canReceivePoints(gm: GuildMember): boolean {
  if (!gm) {
    return false;
  }
  const member = new Member(gm);
  return !gm.user.bot && member.verified;
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
