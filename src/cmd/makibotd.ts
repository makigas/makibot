#!/usr/bin/env node

import Makibot from "../Makibot";
import serverFactory from "../lib/http/server";
import logger from "../lib/logger";
import * as Sentry from "@sentry/node";
import { getDatabase, getKarmaDatabase } from "../settings";
import { newModRepository } from "../lib/modlog/database";
import { SettingProvider } from "../lib/provider";
import { openKarmaDatabase } from "../lib/karma/database";

logger.info(".88b  d88.  .d8b.  db   dD d888888b d8888b.  .d88b.  d888888b ");
logger.info("88'YbdP`88 d8' `8b 88 ,8P'   `88'   88  `8D .8P  Y8. `~~88~~' ");
logger.info("88  88  88 88ooo88 88,8P      88    88oooY' 88    88    88    ");
logger.info("88  88  88 88~~~88 88`8b      88    88~~~b. 88    88    88    ");
logger.info("88  88  88 88   88 88 `88.   .88.   88   8D `8b  d8'    88    ");
logger.info("YP  YP  YP YP   YP YP   YD Y888888P Y8888P'  `Y88P'     YP    ");
logger.info("");

if (!process.env.BOT_TOKEN) {
  logger.error("Missing BOT_TOKEN environment variable. Please setup!");
  process.exit(1);
}

/* Feed me: SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE */
Sentry.init();

async function makibotFactory(): Promise<Makibot> {
  logger.debug("loading main database...");
  const database = await getDatabase();

  logger.debug("preparing moderation repository...");
  const modrepo = await newModRepository(database);

  logger.debug("preparing setting provider...");
  const provider = new SettingProvider(database);
  await provider.init();

  logger.debug("loading karma database...");
  const karmaDatabase = await getKarmaDatabase();

  logger.debug("initialising karma database...");
  const karma = await openKarmaDatabase(karmaDatabase);

  return new Makibot(modrepo, provider, karma);
}

makibotFactory().then(async (makibot) => {
  await makibot.connect();
  const server = serverFactory(makibot);
  const service = server.listen(8080, "0.0.0.0");

  function kill(): void {
    makibot.shutdown(0);
    service.close();
  }

  ["SIGTERM", "SIGINT"].forEach((sig) => process.on(sig, kill));
});
