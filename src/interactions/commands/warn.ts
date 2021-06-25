import { GuildMember, User } from "discord.js";
import Member from "../../lib/member";
import InteractionCommand from "../../lib/interaction/basecommand";
import applyWarn from "../../lib/warn";

interface WarnParameters {
  target: GuildMember,
  reason?: string,
};

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
      ]
    }
   */
  async handle({ reason, target }: WarnParameters): Promise<void> {
    let member = new Member(target);
    if (member.moderator) {
      this.sendResponse(`No se puede poner un warn a <@${target.id}> porque es mod.`, true);
    } else if (target.user.bot) {
      this.sendResponse(`No puedes ponerle un warn a un bot`, true);
    } else {
      await applyWarn(target.guild, { user: target.user, reason });
      this.sendResponse(`Warn aplicado correctamente.`, true);
    }
  }
}