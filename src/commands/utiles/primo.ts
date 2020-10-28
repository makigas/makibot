import bigInt, { BigInteger } from "big-integer";
import { Command, CommandoMessage } from "discord.js-commando";

import Makibot from "../../Makibot";

interface PrimoCommandArguments {
  n: string;
}

export = class PrimoCommand extends Command {
  constructor(client: Makibot) {
    super(client, {
      name: "primo",
      group: "utiles",
      memberName: "primo",
      description: "Calcula si un número es primo o no.",
      examples: ["prime 5", "prime 6", "prime 1234"],
      args: [
        {
          key: "n",
          type: "string",
          prompt: "No me has dicho de qué número quieres calcular el primo.",
          default: "",
        },
      ],
    });
  }

  async run(msg: CommandoMessage, args: PrimoCommandArguments) {
    if (args.n.trim() == "") {
      return msg.reply("Uso: `!primo [n:number]`");
    } else if (/^\-?\d+$/g.test(args.n)) {
      let prime = bigInt(args.n);
      if (this.isPrime(prime)) {
        return msg.reply(`Se da la circunstancia de que sí, ${prime} es primo.`);
      } else if (prime.mod(2).eq(0)) {
        return msg.reply("Amigo, deberías saber que un par no puede ser primo.");
      } else {
        return msg.reply(`No, ${prime} no es primo.`);
      }
    } else {
      return msg.reply(`\`${args.n}\` no es exactamente un número.`);
    }
  }

  private isPrime(n: BigInteger): boolean {
    if (n.eq(2) || n.eq(3) || n.eq(5)) return true;
    if (n.lt(2) || n.mod(2).eq(0) || n.mod(3).eq(0) || n.mod(5).eq(0)) return false;
    let start = Date.now();
    for (let i = bigInt(7); !i.multiply(i).gt(n); i = i.add(6)) {
      let elapsed = Date.now() - start;
      if (elapsed > 1000) return this.isPrimeProbabilistic(n);
      if (n.mod(i).eq(0) || n.mod(i.add(4)).eq(0)) return false;
    }
    return true;
  }

  /**
   * Applies Fermat probabilistic theorem to guess whether n could be prime.
   * Remember, there could be some pseudoprimes triggering the function
   * despite them not being prime.
   *
   * @param {BigInteger} n - The number to test.
   * @return {boolean} false unless n is prime or pseoduprime.
   */
  private isPrimeProbabilistic(n: BigInteger) {
    if (n.eq(1)) return false;
    for (let i = 0; i < 100; ++i) {
      let a = bigInt.randBetween(1, 100000000).mod(n).add(1);
      if (!this.ipow_mod(a, n.subtract(1), n).eq(1)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calculates b^exp (mod n) using modular algebra.
   *
   * @param {number} base - Base
   * @param {number} exp - Exponent
   * @param {number} mod - Modulus
   * @return (b ^ exp) (mod n)
   */
  private ipow_mod(base: BigInteger, exp: BigInteger, mod: BigInteger) {
    let res = bigInt(1);
    while (exp.gt(0)) {
      if (exp.mod(2).eq(1)) {
        res = res.multiply(base).mod(mod);
      }
      base = base.multiply(base).mod(mod);
      exp = exp.divide(2);
    }
    return res.mod(mod);
  }
};
