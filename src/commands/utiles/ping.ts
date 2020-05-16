import Commando from "discord.js-commando";
import { Message } from "discord.js";

import Makibot from "../../Makibot";

export = class PingCommand extends Commando.Command {
  constructor(client: Makibot) {
    super(client, {
      name: "ping",
      memberName: "ping",
      group: "utiles",
      description: "Determina el tiempo de reacción del bot.",
    });
  }

  async run(msg: Commando.CommandMessage) {
    if (msg.editedTimestamp == null) {
      return msg.channel
        .send("pong")
        .then((sent: Message) => {
          const rtt = sent.createdTimestamp - msg.createdTimestamp;
          return sent.edit(`${sent.content} - RTT: ${rtt} ms`);
        })
        .then((sent: Message) => {
          const heartbeat = msg.client.ws.ping;
          return sent.edit(`${sent.content} - Ping: ${heartbeat} ms`);
        });
    }
  }
};
