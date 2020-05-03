#!/usr/bin/env node

import Makibot from "./Makibot";

let makibot = new Makibot();
process.on("SIGTERM", () => makibot.shutdown(0));
process.on("SIGINT", () => makibot.shutdown(0));
