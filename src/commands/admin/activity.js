import { Command } from 'discord.js-commando';

export default class ActivityCommand extends Command {

  constructor(client) {
    super(client, {
      name: 'activity',
      memberName: 'activity',
      group: 'admin',
      description: 'Ajusta las opciones de actividad del bot',
      args: [
        { key: 'activity', type: 'string', prompt: 'Actividad a establecer.', default: '' }
      ]
    });
  }

  async run(msg, { activity }) {
    if (msg.client.isOwner(msg.author)) {
      if (activity == '') {
        msg.client.user.setGame(null);
        msg.reply('Eliminada actividad del bot.');
      } else {
        msg.client.user.setGame(activity);
        msg.reply('Actualizada actividad del bot.');
      }
    } else {
      msg.reply('No estás en el archivo sudoers. Este incidente será reportado :oncoming_police_car:');
    }
  }
}
