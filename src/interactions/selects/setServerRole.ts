import { SelectMenuInteraction } from "discord.js";
import { SelectMenuInteractionHandler } from "../../lib/interaction";
import { createRolesMessage, ROLE_DEFINITIONS } from "../../lib/makigas/roles";

function difference(a: string[], b: string[]): string[] {
  return a.filter((i) => !b.includes(i));
}

export default class ModMenuAlert implements SelectMenuInteractionHandler {
  name = "Set server role";

  async handle(event: SelectMenuInteraction): Promise<void> {
    if (event.inGuild()) {
      /* event.member might not contain the information we are interested in. */
      const member = await event.guild.members.fetch(event.user.id);
      const acceptableRoles = ROLE_DEFINITIONS.map((r) => r.label);
      const currentRoles = member.roles.cache
        .map((role) => role.name)
        .filter((r) => acceptableRoles.includes(r));
      const desiredRoles = event.values;

      /* Set and unset roles that should not apply here. */
      const rolesCache = event.guild.roles.cache;
      await member.roles.add(
        difference(desiredRoles, currentRoles).map((r) => rolesCache.find((p) => p.name === r))
      );
      await member.roles.remove(
        difference(currentRoles, desiredRoles).map((r) => rolesCache.find((p) => p.name === r))
      );

      /* Update the dropdown with the new values. */
      await event.update(createRolesMessage(member));
    }
  }
}
