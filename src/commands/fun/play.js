const Commando = require('discord.js-commando');
const fs = require('fs');

module.exports = class HornCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: 'play',
      memberName: 'play',
      group: 'fun',
      description: 'Reproduce un audio (debes estar en un canal de voz)'
    });
  }

  async run(msg, argv) {
    let audio_name = argv.replace(/[^a-z0-9_]/gmi, ' ');
    let file = `contrib/${audio_name}.mp3`;
    if (fs.existsSync(file)) {
      if (msg.member.voiceChannel) {
        let channel = msg.member.voiceChannel;
        channel.join().then(conn => {
          let dispatcher = conn.playFile(file);
          dispatcher.on('end', () => conn.disconnect());
          dispatcher.on('error', e => console.log(e));
        }).catch(console.log);
      } else {
        msg.reply('Debes unirte a un canal de voz para usar este comando');
      }
    }
    else {
      msg.reply(`Deberías saber que el archivo ${audio_name} no existe, no vuelvas a preguntar por el!`);
    }
  }
}
