import { Command } from 'discord.js-commando';
import bigInt from 'big-integer';

/**
 * Calculates b^exp (mod n) using modular algebra.
 * @param {number} base - Base
 * @param {number} exp - Exponent
 * @param {number} mod - Modulus
 * @return (b ^ exp) (mod n)
 */
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

/**
 * Applies Fermat probabilistic theorem to guess whether n could be prime.
 * Remember, there could be some pseudoprimes triggering the function despite
 * them not being prime.
 * @param {number} n - The number to test.
 * @return {boolean} false unless n is prime or pseoduprime.
 */
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

/**
 * Test whether a number is prime or not.
 * @param {number} n - The number to test.
 * @return {boolean} false unless n is prime.
 */
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

export default class PrimoCommand extends Command {

  /** @param {Commando.CommandoClient} client - Client instance. */
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

  /**
   * @param {Commando.CommandMessage} msg – Sent message.
   * @param {Object} argv - Provided arguments.
   * @param {number} argv.n - The integer number to test for being prime.
   */
  async run(msg, { n }) {
    let prime = bigInt(n);
    if (isPrime(prime)) {
      msg.reply(`Se da la circunstancia de que sí, ${prime} es primo.`);
    } else if (prime.mod(2) == 0) {
      msg.reply(`amigo, deberías saber que un par no puede ser primo.`);
    } else {
      msg.reply(`No, ${prime} no es primo.`);
    }
  }
}
