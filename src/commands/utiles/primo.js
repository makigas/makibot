const Commando = require('discord.js-commando');
const bigInt = require('big-integer');

const ipow_mod = (base, exp, mod) => {
  let res = bigInt(1);
  while (exp > 0) {
    if (exp.mod(2) == 1) {
      res = res.multiply(base).mod(mod);
    }
    base = base.multiply(base).mod(mod);
    exp = exp.divide(2);
  }
  return res.mod(mod);
};

const isPrimeProbabilistic = n => { // fermat
  if (n.eq(1)) return false;
  for (let i = 0; i < 100; ++i) {
    let a = bigInt.randBetween(1, 100000000).mod(n).add(1);
    if (ipow_mod(a, n.subtract(1), n) != 1) {
      return false;
    }
  }
  return true;
};

const isPrime = n => {
  if (n.eq(2) || n.eq(3) || n.eq(5)) return true;
  if (n.lt(2) || n.mod(2) == 0 || n.mod(3) == 0 || n.mod(5) == 0) return false;
  let start = Date.now();
  for (let i = bigInt(7); !i.multiply(i).gt(n); i = i.add(6)) {
    let elapsed = Date.now() - start;
    if (elapsed > 1000) return isPrimeProbabilistic(n);
    if (n.mod(i) == 0 || n.mod(i+4) == 0) return false;
  }
  return true;
};

module.exports = class PrimoCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: 'primo',
      group: 'utiles',
      memberName: 'primo',
      description: 'Calcula si un número es primo o no.',
      examples: ['prime 5', 'prime 6', 'prime 1234'],
      args: [
        { key: 'n', type: 'string', prompt: 'No me has dicho de qué número quieres calcular el primo.' }
      ]
    });
  }

  async run(msg, argv) {
    let prime = bigInt(argv.n);
    if (isPrime(prime)) {
      msg.reply(`Se da la circunstancia de que sí, ${prime} es primo.`);
    } else if (prime.mod(2) == 0) {
      msg.reply(`amigo, deberías saber que un par no puede ser primo.`);
    } else {
      msg.reply(`No, ${prime} no es primo.`);
    }
  }
}
