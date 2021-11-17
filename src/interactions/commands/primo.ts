import bigInt, { BigInteger } from "big-integer";
import type { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { createToast } from "../../lib/response";

function sendToast(event: CommandInteraction, title: string): Promise<void> {
  const toast = createToast({
    title,
    severity: "info",
  });
  return event.reply({ embeds: [toast] });
}

export default class PrimoCommand implements CommandInteractionHandler {
  name = "primo";

  handle(command: CommandInteraction): Promise<void> {
    const n = command.options.getString("n", true);
    if (/^-?\d+$/g.test(n)) {
      const prime = bigInt(n);
      if (prime.lt(0)) {
        return sendToast(command, `Vamos a dejarlo en que un negativo no debería ser primo`);
      } else if (this.isPrime(prime)) {
        return sendToast(command, `Informamos que ${prime} es un número primo`);
      } else if (prime.eq(0)) {
        return sendToast(command, `El cero no es divisible por sí mismo`);
      } else if (prime.mod(2).eq(0)) {
        return sendToast(command, `Deberías saber que un par nunca puede ser primo`);
      } else {
        return sendToast(command, `No, ${prime} no es un número primo`);
      }
    } else {
      return sendToast(command, `"${n}" no es exactamente un número natural`);
    }
  }

  private isPrime(n: BigInteger): boolean {
    if (n.eq(2) || n.eq(3) || n.eq(5)) return true;
    if (n.lt(2) || n.mod(2).eq(0) || n.mod(3).eq(0) || n.mod(5).eq(0)) return false;
    const start = Date.now();
    for (let i = bigInt(7); !i.multiply(i).gt(n); i = i.add(6)) {
      const elapsed = Date.now() - start;
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
  private isPrimeProbabilistic(n: BigInteger): boolean {
    if (n.eq(1)) return false;
    for (let i = 0; i < 100; ++i) {
      const a = bigInt.randBetween(1, 100000000).mod(n).add(1);
      if (!this.iPowMod(a, n.subtract(1), n).eq(1)) {
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
  private iPowMod(base: BigInteger, exp: BigInteger, mod: BigInteger): BigInteger {
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
