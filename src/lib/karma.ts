import { GuildMember } from "discord.js";
import Makibot from "../Makibot";
import Tag from "./tag";

class MemberTag extends Tag {
  constructor(member: GuildMember, key: string) {
    super((member.client as Makibot).provider, `member:${member.id}:${key}`, {
      guild: member.guild,
    });
  }
}

const MAX_POINTS_PER_DAY = 30;

const TIME_TO_RESET_POINTS = 86400_000;

export default class Karma {
  private readonly tags: {
    points: Tag;
    pointsTakenToday: Tag;
    pointsGivenToday: Tag;
    todayResetsAt: Tag;
  };

  constructor(member: GuildMember) {
    this.tags = {
      points: new MemberTag(member, "points"),
      pointsTakenToday: new MemberTag(member, "pointsTakenToday"),
      pointsGivenToday: new MemberTag(member, "pointsGivenToday"),
      todayResetsAt: new MemberTag(member, "todayResetsAt"),
    };
  }

  get points(): number {
    return this.tags.points.get(0);
  }

  /**
   * If the reset timestamp has been crossed, this function will reset all
   * the counters so that the member can be given and taken points again.
   */
  private async checkResetStaleness(): Promise<void> {
    if (Date.now() >= this.tags.todayResetsAt.get(0)) {
      await this.tags.pointsGivenToday.delete();
      await this.tags.pointsTakenToday.delete();
      await this.tags.todayResetsAt.delete();
    }
  }

  /**
   * Clamps the given number of points to make sure that the value is never
   * higher than the maximum number of points that can be still be given
   * today. Returns the final amount of points that can be given for this
   * operation, which may equal the input number of points if there are
   * enough.
   * @param points number of points that would be given
   * @return the number of points that will finally be given
   */
  private async clampGrantPoints(points: number): Promise<number> {
    await this.checkResetStaleness();
    const maxForToday = MAX_POINTS_PER_DAY - this.tags.pointsGivenToday.get(0);
    return Math.min(points, maxForToday);
  }

  /**
   * Clamps the given number of points to make sure that the value is never
   * higher than the maximum number of points that can be still be taken
   * today. Returns the final amount of points that can be taken for this
   * operation, which may equal the input number of points if there are
   * enough.
   * @param points number of points that would be taken
   * @return the number of points that will finally be taken
   */
  private async clampTakePoints(points: number): Promise<number> {
    await this.checkResetStaleness();
    const maxForToday = MAX_POINTS_PER_DAY - this.tags.pointsTakenToday.get(0);
    return Math.min(points, maxForToday);
  }

  /**
   * Will set the reset timer to the next cooldown breakpoint unless the reset
   * timer is already set. This method simply exists to avoid having duplicate
   * logic around.
   */
  private tickResetTimer(): Promise<number> {
    return this.tags.todayResetsAt.set(
      this.tags.todayResetsAt.get(Date.now() + TIME_TO_RESET_POINTS)
    );
  }

  /**
   * Gives an amount of points to the user owning this karma bag. Note that
   * this method is constrainted to the limits in time and points that can
   * be given at this exact time.
   * @param points number of points that will be given to this user
   */
  async grantPoints(points: number): Promise<void> {
    const realPoints = await this.clampGrantPoints(points);
    if (realPoints > 0) {
      await Promise.all([
        this.tags.points.set(this.points + realPoints),
        this.tags.pointsGivenToday.set(this.tags.pointsGivenToday.get(0) + realPoints),
        this.tickResetTimer(),
      ]);
    }
  }

  /**
   * Withdraws an amount of points to the user owning this karma bag. Note
   * that this method is constrainted to the limits in time and points that
   * can be given at this exact time.
   * @param points number of points that will be given to this user
   */
  async takePoints(points: number): Promise<void> {
    const realPoints = await this.clampTakePoints(points);
    if (realPoints > 0) {
      await Promise.all([
        this.tags.points.set(Math.max(0, this.points - realPoints)),
        this.tags.pointsTakenToday.set(this.tags.pointsTakenToday.get(0) + realPoints),
        this.tickResetTimer(),
      ]);
    }
  }
}
