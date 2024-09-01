import { Database } from "sqlite";
import logger from "../logger";

type BigBlob = Record<string, object>;

async function inputDatabaseNeedsMigration(db: Database): Promise<boolean> {
  const hasTable = await db.get(
    `SELECT COUNT(*) AS total FROM sqlite_master WHERE type='table' AND name='settings'`,
  );
  if (hasTable.total == 0) {
    return false;
  }
  const result = await db.get(`SELECT COUNT(*) AS total FROM settings`);
  return result.total > 0;
}

async function fetchOldSettings(
  db: Database,
  callback: (guild: string, key: string, value: BigBlob) => void,
) {
  await db.each(`SELECT CAST(guild AS TEXT) AS guild, settings FROM settings`, (err, data) => {
    if (err) {
      throw err;
    } else if (data) {
      const { guild, settings } = data;
      const parsedSettings: object = JSON.parse(settings);
      Object.entries(parsedSettings).forEach(([key, value]) => {
        callback(guild, key, value);
      });
    }
  });
}

async function migrateSetting(
  db: Database,
  guild: string,
  key: string,
  value: BigBlob,
): Promise<void> {
  const encodedValue = JSON.stringify(value);
  await db.run("INSERT OR REPLACE INTO bot_settings(guild, key, value) VALUES(?, ?, ?)", [
    guild,
    key,
    encodedValue,
  ]);
}

async function clearOldSettings(db: Database) {
  await db.exec(`DELETE FROM settings`);
}

export async function migrateSettingsSchema(db: Database) {
  if (await inputDatabaseNeedsMigration(db)) {
    logger.info("[unroller] database needs migration!");
    await db.exec("BEGIN TRANSACTION");
    await fetchOldSettings(
      db,
      async (guild, key, value) => await migrateSetting(db, guild, key, value),
    );
    await clearOldSettings(db);
    await db.exec("COMMIT");
  } else {
    logger.info("[unroller] database is clean");
  }
}
