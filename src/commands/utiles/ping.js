import { Command } from 'discord.js-commando';

export default class PingCommand extends Command {

  constructor(client) {
    super(client, {
      name: 'ping',
      memberName: 'ping',
      group: 'utiles',
      description: 'Determina si el bot está vivo'
    });
  }

  async run(msg) {
    msg.reply('pong');
  }
}
