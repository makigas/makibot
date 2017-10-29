const Commando = require('discord.js-commando');

module.exports = class PingCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: 'ping',
      memberName: 'ping',
      group: 'utiles',
      description: 'Determina si el bot está vivo'
    });
  }

  async run(msg, argv) {
    msg.reply('pong');
  }
}
