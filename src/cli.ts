#!/usr/bin/env node

import Makibot from './Makibot';

let makibot = new Makibot();
process.once('SIGTERM', () => makibot.shutdown());
process.once('SIGINT', () => makibot.shutdown());
