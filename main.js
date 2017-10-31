import Makibot from './src/Makibot';

var config = require('./config/config.json');
var bot = new Makibot(config);

// Disconnect the bot on Ctrl-C / SIGINT.
process.on('SIGINT', () => {
    bot.shutdown();
    process.exit();
});
