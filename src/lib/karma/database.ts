import { Snowflake } from "discord.js";
import { readFileSync } from "fs";
import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";

interface KarmaUndoActionParams {
  kind: string;
  originatorId?: Snowflake;
  actorId: Snowflake;
  actorType: string;
}

interface KarmaCountParams {
  kind?: string;
  seconds?: number;
}

interface KarmaActionParams {
  target: Snowflake;
  actorId: Snowflake;
  actorType: string;
  originatorId: Snowflake;
  kind: string;
  points: number;
}

export interface KarmaDatabase {
  count(target: Snowflake, settings?: KarmaCountParams): Promise<number>;
  undoAction(actor: KarmaUndoActionParams): Promise<void>;
  action(options: KarmaActionParams): Promise<void>;

  bountiesSentToday(sender: Snowflake): Promise<number>;
  bountiesReceivedToday(receiver: Snowflake): Promise<number>;
  bounty(id: Snowflake, sender: Snowflake, receiver: Snowflake, amount: number): Promise<void>;

  loot(interaction: Snowflake, guild: Snowflake, target: Snowflake): Promise<number>;
  yesterdayLoot(guild: Snowflake, target: Snowflake): Promise<number>;
  lootedToday(guild: Snowflake, target: Snowflake): Promise<boolean>;
}

class SqliteKarmaDatabase implements KarmaDatabase {
  private db: Database;

  /**
   *
   * @param {sqlite.Database} db
   */
  constructor(db: Database) {
    this.db = db;
  }

  bountiesSentToday(sender: Snowflake): Promise<number> {
    const query = `
      SELECT sum(points) AS total
      FROM karma
      WHERE originator_id = ?
      AND kind='bounty'
      AND DATE(datetime) == datetime('now')`;
    const params = [sender];
    return this.db.get(query, params).then(({ total }) => total || 0);
  }

  bountiesReceivedToday(receiver: Snowflake): Promise<number> {
    const query = `
      SELECT sum(points) AS total
      FROM karma
      WHERE target_id = ?
      AND kind='bounty'
      AND DATE(datetime) == datetime('now')`;
    const params = [receiver];
    return this.db.get(query, params).then(({ total }) => total || 0);
  }

  async bounty(
    id: Snowflake,
    sender: Snowflake,
    receiver: Snowflake,
    amount: number
  ): Promise<void> {
    /* FIXME: this is not using a transaction. node-sqlite3 doesn't support transactions ·_· */
    try {
      await Promise.all([
        this.action({
          actorType: "Interaction",
          actorId: id,
          kind: "bounty",
          originatorId: sender,
          target: receiver,
          points: amount,
        }),
        this.action({
          actorType: "Interaction",
          actorId: id,
          kind: "bounty-send",
          originatorId: receiver,
          target: sender,
          points: -amount,
        }),
      ]);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  count(target: Snowflake, { kind, seconds }: KarmaCountParams = {}): Promise<number> {
    let query = `SELECT SUM(points) AS score FROM karma WHERE target_id = ?`;
    const params: [number | string] = [target];
    if (kind) {
      query += ` AND kind = ?`;
      params.push(kind);
    }
    if (seconds && Number.isInteger(seconds)) {
      query += ` AND datetime >= DATETIME('now', ?)`;
      params.push(`-${seconds} seconds`);
    }
    return this.db.get(query, params).then(({ score }) => score || 0);
  }

  async undoAction({
    originatorId,
    kind,
    actorId,
    actorType,
  }: KarmaUndoActionParams): Promise<void> {
    let query = "DELETE FROM karma WHERE actor_id = ? AND actor_type = ? AND kind = ?";
    const params = [actorId, actorType, kind];
    if (originatorId) {
      query += " AND originator_id = ?";
      params.push(originatorId);
    }
    await this.db.run(query, params);
  }

  async action({
    target,
    actorId,
    actorType,
    originatorId,
    kind,
    points,
  }: KarmaActionParams): Promise<void> {
    await this.db.run(
      `INSERT INTO karma(
        actor_id, actor_type, kind, originator_id, target_id, datetime, points
      ) values (
        ?, ?, ?, ?, ?, datetime('now'), ?
      )`,
      [actorId, actorType, kind, originatorId, target, points]
    );
  }

  async loot(interaction: Snowflake, guild: Snowflake, target: Snowflake): Promise<number> {
    const lootedToday = await this.lootedToday(guild, target);
    if (!lootedToday) {
      const points = (await this.yesterdayLoot(guild, target)) + 1;
      await this.db.run(
        `
     INSERT INTO karma(
       actor_id, actor_type, kind, originator_id, target_id, datetime, points
     ) values (
       ?, 'Interaction', 'loot', ?, ?, DATETIME('now'), ?
     )
     `,
        [interaction, guild, target, points]
      );
      return points;
    }
    return 0;
  }

  async yesterdayLoot(guild: Snowflake, target: Snowflake): Promise<number> {
    const query = `SELECT points FROM karma
     WHERE kind = 'loot'
     AND originator_id = ?
     AND target_id = ?
     AND datetime >= DATETIME('now', '-1 day', 'start of day')
     AND datetime < DATETIME('now', 'start of day')
     LIMIT 1`;
    const params = [guild, target];

    const result = await this.db.get(query, params);
    return result ? result.points || 0 : 0;
  }

  async lootedToday(guild: Snowflake, target: Snowflake): Promise<boolean> {
    const query = `SELECT COUNT(*) AS count FROM karma
     WHERE kind = 'loot'
     AND originator_id = ?
     AND target_id = ?
     AND datetime >= DATETIME('now', 'start of day')
     AND datetime < DATETIME('now', '+1 day', 'start of day')`;
    const params = [guild, target];
    const { count } = await this.db.get(query, params);
    return !!count && count > 0;
  }
}

export async function openKarmaDatabase(database: string): Promise<KarmaDatabase> {
  const db = await open({
    filename: database,
    driver: sqlite3.Database,
  });
  const scripts = [
    "./schemas/karma/karma.sql",
    "./schemas/karma/offset.sql",
    "./schemas/karma/histogram.sql",
    "./schemas/karma/transactions.sql",
    "./schemas/karma/totals.sql",
  ];
  for (const script of scripts) {
    const content = readFileSync(script).toString();
    await db.run(content);
  }
  return new SqliteKarmaDatabase(db);
}
