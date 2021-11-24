import { Snowflake } from "discord-api-types";

export type ModEventType = "DELETE" | "WARN" | "UNWARN" | "MUTE" | "UNMUTE" | "KICK" | "BAN";

/**
 * A moderation event as created and managed by the system.
 */
export interface ModEvent {
  /** The moderation event ID. */
  id?: number;

  /** The guild in which the moderation event happened. */
  guild: Snowflake;

  /** The account that receives the moderation action. */
  target: Snowflake;

  /** The account that issues the moderation action. */
  mod: Snowflake;

  /** The type of action that was issued. */
  type: ModEventType;

  /** The reason behind the moderation action. */
  reason?: string;

  /** The datetime at which the moderation event happened. */
  createdAt: Date;

  /** The datetime at which the action will expire, if ever. */
  expiresAt?: Date;

  /** True if the expired action has already been handled. */
  expired: boolean;
}
