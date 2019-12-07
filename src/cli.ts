#!/usr/bin/env node

import Makibot from "./Makibot";

let makibot = new Makibot();
process.on("SIGTERM", () => makibot.shutdown());
process.on("SIGINT", () => makibot.shutdown());
