process.env.NODE_PATH = __dirname;
var config = require('./src/ConfigLoader.js')();
var Makibot = require('./src/Makibot');

// Start bot.
var bot = new Makibot(config);

// Disconnect the bot on Ctrl-C / SIGINT.
process.on('SIGINT', () => {
  bot.shutdown();
  process.exit();
});