const Commando = require('discord.js-commando');

module.exports = class ActivityCommand extends Commando.Command {
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

  async run(msg, argv) {
    if (msg.client.isOwner(msg.author)) {
      if (argv.activity == '') {
        msg.client.user.setGame(null);
        msg.reply('Eliminada actividad del bot.');
      } else {
        msg.client.user.setGame(argv.activity);
        msg.reply('Actualizada actividad del bot.');
      }
    } else {
      msg.reply('No estás en el archivo sudoers. Este incidente será reportado :oncoming_police_car:');
    }
  }
}
