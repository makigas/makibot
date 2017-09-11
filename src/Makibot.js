const Discord = require('discord.js');

class Makibot extends Discord.Client {

  constructor(config) {
    super();
    this._config = config;

    if (this._validateSettings()) {
      this.on('ready', this._onConnected);
      this.on('message', this._onMessageReceived);
      this.login(config.bot_token);
    } else {
      console.error("ERROR! Invalid settings. Please, verify your config.json");
    }
  }

  _onConnected() {
    console.log(`Successfully logged in as ${this.user.tag}!`);
  }

  _onMessageReceived(msg) {
    if (msg.content == '!ping') {
      msg.reply('pong!');
    }
  }

  _validateSettings() {
    let token = this._config.bot_token;
    return token != null && typeof(token) == 'string' && token != '';
  }

  shutdown() {
    console.log('The bot was asked to shutdown. Good night!');
    this.destroy();
  }
}

module.exports = Makibot;