import { ModEvent, ModEventType } from "./types";
import type { Database } from "sqlite";

interface EventRow {
  id: number;
  guild_id: string;
  target_id: string;
  mod_id: string;
  kind: string;
  reason?: string;
  created_at: string;
  expires_at?: string;
  evicted: false;
}

/** The SQL code containing the definition of the moderation table. */
const MIGRATION = `
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER NOT NULL PRIMARY KEY,
    guild_id VARCHAR(64) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    mod_id VARCHAR(64) NOT NULL,
    kind VARCHAR(32) NOT NULL,
    reason VARCHAR(256),
    created_at DATETIME NOT NULL,
    expires_at DATETIME,
    evicted BOOLEAN
  );
`;

const INSERT_EVENT = `
  INSERT INTO events (
    guild_id, target_id, mod_id, kind, reason, created_at, expires_at, evicted
  )
  VALUES (?, ?, ?, ?, ?, datetime('now'), ?, false);
`;

const RETRIEVE_EVENT = `
  SELECT created_at, evicted, expires_at, guild_id, mod_id, target_id, kind, id, reason
  FROM events
  WHERE id = ?
`;

const RETRIEVE_EXPIRED = `
  SELECT created_at, evicted, expires_at, guild_id, mod_id, target_id, kind, id, reason
  FROM events
  WHERE expires_at < datetime('now')
  AND kind in ('TIMEOUT')
  AND evicted = false
`;

const EXPIRE_EVENT = `
  UPDATE events
  SET evicted = true
  WHERE id = ?
`;

const EXPIRE_ANY = `
  UPDATE events
  SET evicted = true
  WHERE id = (
    SELECT id
    FROM events
    WHERE target_id = ?
    AND kind = ?
    AND evicted = 0
  )
`;

export interface ModerationRepository {
  /** Save a moderation event, return the event number as callback. */
  persistEvent(event: ModEvent): Promise<ModEvent>;

  /** Retrieve a moderation event by event number. */
  retrieveEvent(id: number): Promise<ModEvent | null>;

  /** Retrieve events that are pending to be evicted. */
  retrieveExpired(): Promise<ModEvent[]>;

  /** Evict an expirable event (mark it as done). */
  evict(id: number): Promise<void>;

  evictAny(member: string, kind: string): Promise<void>;
}

function isValidModEventType(type: string): type is ModEventType {
  const types: string[] = ["KICK", "BAN", "TIMEOUT", "UNTIMEOUT"];
  return types.indexOf(type) >= 0;
}

function rowToModEvent(row: EventRow): ModEvent {
  if (!isValidModEventType(row.kind)) {
    throw new Error("Invalid mod event type");
  }
  return {
    createdAt: new Date(row.created_at),
    expired: row.evicted,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    guild: row.guild_id,
    mod: row.mod_id,
    target: row.target_id,
    type: row.kind,
    id: row.id,
    reason: row.reason,
  };
}

class SqliteBaseModerationRepository implements ModerationRepository {
  constructor(private db: Database) {}

  async persistEvent(event: ModEvent): Promise<ModEvent> {
    /* Place the moderation event in the system. */
    const values = [
      event.guild,
      event.target,
      event.mod,
      event.type,
      event.reason || null,
      event.expiresAt ? event.expiresAt.toISOString().replace("T", " ") : null,
    ];
    await this.db.run(INSERT_EVENT, values);

    /* Assign rowid */
    const { id } = await this.db.get("select last_insert_rowid() as id");
    const persistedEvent = { ...event, id };
    return persistedEvent;
  }

  async retrieveEvent(id: number): Promise<ModEvent | null> {
    const row: EventRow | undefined = await this.db.get(RETRIEVE_EVENT, [id]);
    if (row) {
      return rowToModEvent(row);
    } else {
      return null;
    }
  }

  async retrieveExpired(): Promise<ModEvent[]> {
    const rows: EventRow[] = await this.db.all(RETRIEVE_EXPIRED);
    return rows.map(rowToModEvent);
  }

  async evict(id: number): Promise<void> {
    await this.db.run(EXPIRE_EVENT, [id]);
  }

  async evictAny(target: string, type: string): Promise<void> {
    await this.db.run(EXPIRE_ANY, [target, type]);
  }

  async initializeDatabase(): Promise<void> {
    return this.db.exec(MIGRATION);
  }
}

export async function newModRepository(db: Database): Promise<ModerationRepository> {
  const repo = new SqliteBaseModerationRepository(db);
  await repo.initializeDatabase();
  return repo;
}
