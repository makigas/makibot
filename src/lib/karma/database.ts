import { Snowflake } from 'discord.js';
import { open, Database } from 'sqlite'
import sqlite3 from 'sqlite3'

const SETUP_SCRIPT = `
  CREATE TABLE IF NOT EXISTS karma (
    actor_id INTEGER NOT NULL,
    actor_type VARCHAR(32) NOT NULL,
    kind VARCHAR(32) NOT NULL,
    target_id INTEGER NOT NULL,
    datetime DATETIME NOT NULL,
    points INTEGER NOT NULL,
    PRIMARY KEY (actor_id, target_id)
  );
`;

interface KarmaUndoActionParams {
    actorId: Snowflake
    actorType: string
}

interface KarmaCountParams {
    kind?: string
    seconds?: number
}

interface KarmaActionParams {
    target: Snowflake
    actorId: Snowflake
    actorType: string
    kind: string
    points: number
}

export interface KarmaDatabase {
    count(target: Snowflake, settings?: KarmaCountParams): Promise<number>
    undoAction(actor: KarmaUndoActionParams): Promise<void>
    action(options: KarmaActionParams): Promise<void>
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

  count(target: Snowflake, { kind, seconds }: { kind?: string, seconds?: number } = {}): Promise<number> {
    let query = `SELECT SUM(points) AS score FROM karma WHERE target_id = ?`;
    const params = [target];
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

  async undoAction({ actorId, actorType }: { actorId: Snowflake, actorType: string }): Promise<void> {
    await this.db.run(
      `DELETE FROM karma WHERE actor_id = ? AND actor_type = ?`,
      [actorId, actorType]
    );
  }

  async action({ target, actorId, actorType, kind, points }: { target: Snowflake, actorId: Snowflake, actorType: string, kind: string, points: number }): Promise<void> {
    await this.db.run(
      `INSERT INTO karma(
        actor_id, actor_type, kind, target_id, datetime, points
      ) values (
        ?, ?, ?, ?, datetime('now'), ?
      )`,
      [actorId, actorType, kind, target, points]
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