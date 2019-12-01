import Commando from "discord.js-commando";

import Makibot from "../../Makibot";

export = class HornCommand extends Commando.Command {
  constructor(client: Makibot) {
    super(client, {
      name: "horn",
      memberName: "horn",
      group: "fun",
      guildOnly: true,
      description: "Prende la vaina (debes estar en un canal de voz)",
    });
  }

  async run(msg: Commando.CommandMessage) {
    if (msg.member.voiceChannel) {
      let channel = msg.member.voiceChannel;
      channel
        .join()
        .then(conn => {
          let dispatcher = conn.playFile("contrib/horn.mp3");
          dispatcher.on("end", () => conn.disconnect());
          dispatcher.on("error", e => console.log(e));
        })
        .catch(console.log);
    } else {
      return msg.reply("debes unirte a un canal de voz para usar este comando");
    }
  }
};
