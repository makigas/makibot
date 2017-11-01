import Makibot from './src/Makibot';

var config = require('./config/config.json');
var bot = new Makibot(config);

// Disconnect the bot on exit.
process.once('SIGINT', () => {
    bot.shutdown();
});

process.once('SIGTERM', () => {
    bot.shutdown();
});
