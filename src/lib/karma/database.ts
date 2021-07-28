import { Snowflake } from "discord.js";
import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";

const SETUP_SCRIPT = `
  CREATE TABLE IF NOT EXISTS karma (
    actor_id INTEGER NOT NULL,
    actor_type VARCHAR(32) NOT NULL,
    kind VARCHAR(32) NOT NULL,
    originator_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    datetime DATETIME NOT NULL,
    points INTEGER NOT NULL,
    PRIMARY KEY (actor_id, kind, originator_id, target_id)
  );
`;

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
}

export async function openKarmaDatabase(database: string): Promise<KarmaDatabase> {
  const db = await open({
    filename: database,
    driver: sqlite3.Database,
  });
  await db.run(SETUP_SCRIPT);
  return new SqliteKarmaDatabase(db);
}
