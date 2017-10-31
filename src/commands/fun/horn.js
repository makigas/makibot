import { Command } from 'discord.js-commando';

export default class HornCommand extends Command {

  constructor(client) {
    super(client, {
      name: 'horn',
      memberName: 'horn',
      group: 'fun',
      description: 'Prende la vaina (debes estar en un canal de voz)'
    });
  }

  async run(msg) {
    if (msg.member.voiceChannel) {
      let channel = msg.member.voiceChannel;
      channel.join().then(conn => {
        let dispatcher = conn.playFile('contrib/horn.mp3');
        dispatcher.on('end', () => conn.disconnect());
        dispatcher.on('error', e => console.log(e));
      }).catch(console.log);
    } else {
      msg.reply('debes unirte a un canal de voz para usar este comando');
    }
  }
}
