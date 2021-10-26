#!/usr/bin/env node

import Makibot from "../Makibot";
import serverFactory from "../lib/http/server";

const makibot = new Makibot();
const server = serverFactory(makibot);
const service = server.listen(8080, "0.0.0.0");

function kill(): void {
  makibot.shutdown(0);
  service.close();
}

process.on("SIGTERM", kill);
process.on("SIGINT", kill);
