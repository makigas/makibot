import * as path from 'path';
import * as fs from 'fs';
import Makibot from './src/Makibot';
import ConfigSchema from './src/ConfigSchema';

let configFile = path.join(__dirname, 'config', 'config.json');
if (fs.existsSync(configFile)) {
  let config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  let makibot = new Makibot(config);
  process.once('SIGTERM', () => makibot.shutdown());
  process.once('SIGINT', () => makibot.shutdown());
} else {
  console.error('config.json file does not exist! Check the docs.');
  process.exit(1);
}
