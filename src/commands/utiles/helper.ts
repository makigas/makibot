import { Command, CommandMessage } from "discord.js-commando";

import Makibot from "../../Makibot";
import Member from "../../lib/member";
import { Message } from "discord.js";

const yes = new Set([
  "true",
  "t",
  "yes",
  "y",
  "on",
  "enable",
  "enabled",
  "1",
  "+",
  "si",
  "s",
  "aceptar",
  "ok",
]);

const no = new Set([
  "false",
  "f",
  "no",
  "n",
  "off",
  "disable",
  "disabled",
  "0",
  "-",
  "cancelar",
  "cancel",
]);

function opmode(mode: string): string {
  mode = mode.toLowerCase().trim();
  if (mode == "") {
    return "help";
  } else if (yes.has(mode)) {
    return "yes";
  } else if (no.has(mode)) {
    return "no";
  } else {
    return "invalid";
  }
}

interface HelperCommandArguments {
  mode: string;
}

export = class HelperCommand extends Command {
  constructor(client: Makibot) {
    super(client, {
      name: "helper",
      group: "utiles",
      memberName: "helper",
      description: "Te mete o te quita del rol de helpers.",
      examples: ["helper true", "helper false"],
      args: [
        {
          key: "mode",
          type: "string",
          prompt: "¿Quieres entrar o salir del rol helpers?.",
          default: "",
        },
      ],
    });
  }

  async run(msg: CommandMessage, args: HelperCommandArguments): Promise<Message | Message[]> {
    const member = new Member(msg.member);

    if (member.warned) {
      return msg.reply("Tienes anulado el comando !helpers debido a una infracción.");
    }
    // Act on behalf of what the user wants.
    switch (opmode(args.mode)) {
      case "yes":
        // Include the user in this role.
        if (member.helper) {
          return msg.reply(`Ya formabas parte del rol helpers.`);
        } else {
          return member
            .setHelper(true)
            .then(() => msg.reply(`Ahora estás en el rol helpers.`))
            .catch((e) => msg.reply(`No puedo satisfacer tu orden porque ${e}.`));
        }

      case "no":
        // Remove the user from this role unless they're never in.
        if (member.helper) {
          return member
            .setHelper(false)
            .then(() => msg.reply(`Ya no formas parte del rol helpers.`))
            .catch((e) => msg.reply(`No puedo satisfacer tu orden porque ${e}.`));
        } else {
          return msg.reply(`No formabas parte del rol helpers.`);
        }

      case "help": {
        const roleStatus = member.helper
          ? `**Formas parte del rol helpers**.`
          : `**No formas parte del rol helpers**.`;
        const helpMessages: string[] = [
          "Envía `!helper on` para unirte al grupo helper.",
          "Envía `!helper off` para abandonar el grupo helper.",
          "",
          "Otros términos reconocidos como on: true, t, yes, y, on, enable, enabled, 1, +, si, s, aceptar, ok",
          "Otros términos reconocidos como off: false, f, no, n, off, disable, disabled, 0, -, cancelar, cancel",
        ];
        return msg.reply([roleStatus].concat(helpMessages).join("\n"));
      }
      case "invalid":
        return msg.reply("Parámetro desconocido. Envía `!helper` para ver la ayuda.");
    }
  }
};
