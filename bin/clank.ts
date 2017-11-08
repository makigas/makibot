import Makibot from '../src/Makibot';

let makibot = new Makibot();
process.once('SIGTERM', () => makibot.shutdown());
process.once('SIGINT', () => makibot.shutdown());
