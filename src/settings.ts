import { stat, mkdir } from "fs";
import { dirname, resolve } from "path";

import { Database, open as sqliteOpen } from "sqlite";
import sqlite3 from "sqlite3";
import { getConfigDirectory } from "./lib/utils";

function assertDirectoryExists(dir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    stat(dir, (statErr, stats) => {
      if (statErr) {
        if (statErr.code === "ENOENT") {
          // The directory does not exist. This is a valid case.
          mkdir(dir, { recursive: true }, (mkdirErr) => {
            if (mkdirErr) {
              reject(mkdirErr);
            } else {
              resolve();
            }
          });
        } else {
          // We don't know which kind of error this is.
          reject(statErr);
        }
      } else {
        if (stats.isDirectory()) {
          resolve();
        } else {
          reject(`${dir} exists but it is not a directory`);
        }
      }
    });
  });
}

export async function getDatabase(): Promise<Database> {
  // The final location where the database file will be created.
  const dbFile = resolve(getConfigDirectory(), "makibot", "settings.db");

  // Need to make sure first that the file exists.
  const pathToDbFile = dirname(dbFile);
  await assertDirectoryExists(pathToDbFile);

  return sqliteOpen({
    filename: dbFile,
    driver: sqlite3.Database,
  });
}

export async function getKarmaDatabase(): Promise<string> {
  const dbFile = resolve(getConfigDirectory(), "makibot", "karma.db");

  // Need to make sure first that the file exists.
  const pathToDbFile = dirname(dbFile);
  await assertDirectoryExists(pathToDbFile);

  return dbFile;
}
