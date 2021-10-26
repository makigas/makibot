import {
  GuildMember,
  MessageActionRow,
  MessageOptions,
  MessageSelectMenu,
  MessageSelectOptionData,
} from "discord.js";

/**
 * Note: this is a very specific list for the use cases of this server. If you are taking
 * this code, you should probably change this with the list of roles that you are using
 * for your server...
 */
export const ROLE_DEFINITIONS = [
  {
    label: "Anuncios",
    description: "Te menciono cuando tenga algo que anunciar",
    emoji: "📰",
  },
  {
    label: "Vídeos",
    description: "Te menciono cuando suba vídeo o inicie directo",
    emoji: "📼",
  },
  {
    label: "Multijugador",
    description: "Para organizar juegos en línea en el canal de juegos",
    emoji: "🎮",
  },
  {
    label: "Helper",
    description: "Te hace mencionable y te señala como alguien que ayuda",
    emoji: "✨",
  },
];

function getRoleDefinitions(member: GuildMember): MessageSelectOptionData[] {
  const memberRoles = member.roles.cache.map((role) => role.name);
  return ROLE_DEFINITIONS.map<MessageSelectOptionData>((roleDefinition) => ({
    ...roleDefinition,
    value: roleDefinition.label,
    default: memberRoles.includes(roleDefinition.label),
  }));
}

/**
 * Build a dropdown menu that can be added to an action row, with the list of roles.
 * It is required to provide the guild member, because this will be used in order to scan
 * the roles the member is already in, to mark them as selected.
 * @param member the guild member used to build the menu
 */
function createDropdown(member: GuildMember): MessageSelectMenu {
  return new MessageSelectMenu({
    customId: "Set server role",
    placeholder: "Definir algún rol",
    minValues: 0,
    maxValues: ROLE_DEFINITIONS.length,
    options: getRoleDefinitions(member),
  });
}

export function createRolesMessage(member: GuildMember): MessageOptions {
  const row = new MessageActionRow({
    components: [createDropdown(member)],
  });
  return {
    content: "Utiliza el menú desplegable para añadir o quitar roles.",
    components: [row],
  };
}
