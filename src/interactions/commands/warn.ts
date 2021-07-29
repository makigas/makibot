import { Guild, GuildMember } from "discord.js";
import Member from "../../lib/member";
import InteractionCommand from "../../lib/interaction/basecommand";
import applyWarn from "../../lib/warn";
import { createToast } from "../../lib/response";

interface WarnParameters {
  target: GuildMember;
  reason?: string;
}

export default class WarnCommand extends InteractionCommand<WarnParameters> {
  name = "warn";

  /*
    {
      "name": "warn",
      "description": "Aplica un warn a una persona que haya hecho algo inapropiado",
      "options": [
        {
          "type": 6,
          "name": "target",
          "description": "A quién le aplicamos el warn",
          "required": true
        },
        {
          "type": 3,
          "name": "reason",
          "description": "Por qué le aplicamos un warn",
          "required": false
        }
      ],
      "default_permission": false
    }
   */
  async handle(_guild: Guild, { reason, target }: WarnParameters): Promise<void> {
    const member = new Member(target);
    if (member.moderator) {
      const toast = createToast({
        title: "No se puede aplicar un warn",
        description: `@${target.user.username} es un moderador.`,
        target: target.user,
        severity: "error",
      });
      return this.sendResponse({ embed: toast, ephemeral: true });
    } else if (target.user.bot) {
      const toast = createToast({
        title: "No se puede aplicar un warn",
        description: `@${target.user.username} es un bot.`,
        target: target.user,
        severity: "error",
      });
      return this.sendResponse({ embed: toast, ephemeral: true });
    } else {
      await applyWarn(target.guild, { user: target.user, reason });
      const toast = createToast({
        title: "Warn aplicado",
        description: `Le has aplicado un warn a @${target.user.username}`,
        target: target.user,
        severity: "success",
      });
      return this.sendResponse({ embed: toast, ephemeral: true });
    }
  }
}
