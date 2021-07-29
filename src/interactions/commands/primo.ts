import bigInt, { BigInteger } from "big-integer";
import { Guild } from "discord.js";
import InteractionCommand from "../../lib/interaction/basecommand";
import { createToast } from "../../lib/response";

interface PrimoParams {
  n: string;
}

/*
    {
      "name": "primo",
      "description": "Determina si un número es primo o no",
      "options": [
        {
          "type": 3,
          "name": "n",
          "description": "El valor que queremos testear como primo",
          "required": true
        }
      ]
    }
 */
export default class PrimoCommand extends InteractionCommand<PrimoParams> {
  name: string = "primo";

  private sendToast(title: string): Promise<void> {
    return this.sendResponse({
      embed: createToast({
        title,
        severity: "info",
      }),
    });
  }

  handle(_guild: Guild, params: PrimoParams): Promise<void> {
    if (/^\-?\d+$/g.test(params.n)) {
      let prime = bigInt(params.n);
      if (this.isPrime(prime)) {
        return this.sendToast(`Informamos que ${prime} es un número primo`);
      } else if (prime.mod(2).eq(0)) {
        return this.sendToast(`Deberías saber que un par nunca puede ser primo`);
      } else {
        return this.sendToast(`No, ${prime} no es un número primo`);
      }
    } else {
      return this.sendToast(`"${params.n}" no es exactamente un número`);
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
}
