#!/usr/bin/env node

import Makibot from "../Makibot";
import serverFactory from "../lib/http/server";
import logger from "../lib/logger";

logger.info(".88b  d88.  .d8b.  db   dD d888888b d8888b.  .d88b.  d888888b ");
logger.info("88'YbdP`88 d8' `8b 88 ,8P'   `88'   88  `8D .8P  Y8. `~~88~~' ");
logger.info("88  88  88 88ooo88 88,8P      88    88oooY' 88    88    88    ");
logger.info("88  88  88 88~~~88 88`8b      88    88~~~b. 88    88    88    ");
logger.info("88  88  88 88   88 88 `88.   .88.   88   8D `8b  d8'    88    ");
logger.info("YP  YP  YP YP   YP YP   YD Y888888P Y8888P'  `Y88P'     YP    ");
logger.info("");

const makibot = new Makibot();
const server = serverFactory(makibot);
const service = server.listen(8080, "0.0.0.0");

function kill(): void {
  makibot.shutdown(0);
  service.close();
}

process.on("SIGTERM", kill);
process.on("SIGINT", kill);
