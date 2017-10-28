const Discord = require('discord.js');
const bigInt = require('big-integer');

const isPrime = n => {
  if (n.lt(2) || n.mod(2) == 0 || n.mod(3) == 0 || n.mod(5) == 0) {
    return false;
  }
  for (let i = bigInt(7); !i.multiply(i).gt(n); i = i.add(6)) {
    if (n.mod(i) == 0 || n.mod(i+4) == 0) {
      return false;
    }
  }
  return true;
};

class Makibot extends Discord.Client {

  constructor(config) {
    super();
    this._config = config;

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
    if (msg.content == '!ping') {
      msg.reply('pong!');
    }

    let prime = /^!prime (\-?\d+)$/;
    if (prime.test(msg.content)) {
      let input = bigInt(prime.exec(msg.content)[1]);
      if (isPrime(input)) {
        msg.reply(`Se da la circunstancia de que sí, ${input} es primo.`);
      } else if (input.mod(2) == 0) {
        msg.reply(`amigo, deberías saber que un par no puede ser primo.`);
      } else {
        msg.reply(`No, ${input} no es primo.`);
      }
    }

    if (msg.content == '!horn') {
      if (msg.member.voiceChannel) {
        let channel = msg.member.voiceChannel;
        channel.join().then(conn => {
          let dispatcher = conn.playFile('contrib/horn.mp3');
          dispatcher.on('end', () => conn.disconnect());
          dispatcher.on('error', e => console.log(e));
        }).catch(console.log);
      }
    }
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
