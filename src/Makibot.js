const Commando = require('discord.js-commando');

class Makibot extends Commando.Client {

  constructor(config) {
    super({
      commandPrefix: '!',
      owner: config.owner,
      disableEveryone: true
    });

    this._config = config;
    this.registry
      .registerDefaultTypes()
      .registerGroups([
        ['fun', 'Entretenimiento'],
        ['utiles', 'Utilidad']
      ])
      .registerCommandsIn(require('path').join(__dirname, 'commands'));

    if (this._validateSettings()) {
      this.on('ready', this._onConnected);
      this.on('message', this._onMessageReceived);
      this.login(config.token);
    } else {
      console.error("ERROR! Invalid settings. Please, verify your config.json");
    }
  }

  _onConnected() {
    console.log(`Successfully logged in as ${this.user.tag}!`);
  }

  _onMessageReceived(msg) {
    console.log(`${msg.author.tag} said at ${msg.channel.name}: ${msg.content}`);
  }

  _validateSettings() {
    let token = this._config.token;
    return token != null && typeof(token) == 'string' && token != '';
  }

  shutdown() {
    console.log('The bot was asked to shutdown. Good night!');
    this.destroy();
  }
}

module.exports = Makibot;
