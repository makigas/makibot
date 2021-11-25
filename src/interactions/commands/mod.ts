import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { applyAction } from "../../lib/modlog/actions";
import { notifyModlog } from "../../lib/modlog/notifications";
import { ModEvent, ModEventType } from "../../lib/modlog/types";
import { createToast } from "../../lib/response";
import { tokenToDate } from "datetoken";
import Server from "../../lib/server";
import Makibot from "../../Makibot";

/**
 * Will coerce the subcommand of this command interaction into a valid type.
 * While it should not happen, it is useful to test that the given subcommand
 * name is one of the approved ones. Also, it is useful to cast this into a
 * valid ModEventType for static typing purposes. If an invalid subcommand was
 * given for some reason, this function will return null.
 *
 * @param command the received interaction
 * @returns the coerced mod event type, or null if cannot match
 */
function castModEventType(command: CommandInteraction): ModEventType {
  const modActions: { [type: string]: ModEventType } = {
    warn: "WARN",
    unwarn: "UNWARN",
    mute: "MUTE",
    unmute: "UNMUTE",
    ban: "BAN",
    kick: "KICK",
  };
  const subcommandName = command.options.getSubcommand();
  return modActions[subcommandName] || null;
}

/**
 * Will possibly get the given expiration timestamp parsing the command option.
 * Some commands such as WARN and MUTE have an additional parameter regarding
 * how much should the affected member wait until the moderation event expires.
 * If this interaction had one of these parameters, the function will retrieve
 * the proper value and convert it into the real expiration date.
 *
 * @param command the received interaction
 * @returns either the Date object with the expiration date, or null
 */
function castExpirationDate(command: CommandInteraction): Date {
  const givenDuration = command.options.getString("duracion");
  try {
    return tokenToDate(givenDuration);
  } catch (e) {
    return tokenToDate("now+d"); // always fallback to a day.
  }
}

/** Code to execute when invalid preconditions are met (user is not mod, etc). */
function replyNonModerator(interaction: CommandInteraction): Promise<void> {
  return interaction.reply({
    ephemeral: true,
    embeds: [
      createToast({
        title: "Acción no permitida",
        description: "No se puede aplicar el comando de moderación en este caso",
        severity: "error",
        target: interaction.user,
      }),
    ],
  });
}

function replyModerator(interaction: CommandInteraction): Promise<void> {
  return interaction.reply({
    ephemeral: true,
    embeds: [
      createToast({
        title: "Acción de moderación aplicada correctamente",
        target: interaction.user,
        severity: "success",
      }),
    ],
  });
}

async function isValidModInteraction(event: CommandInteraction): Promise<boolean> {
  const server = new Server(event.guild);
  const originator = await server.member(event.user.id);
  const target = await server.member(event.options.get("cuenta", true).value as string);
  return event.inGuild() && originator.moderator && !target.moderator && !target.user.bot;
}

function translateInteractionToModEvent(event: CommandInteraction): ModEvent {
  return {
    createdAt: new Date(),
    expired: false,
    guild: event.guildId,
    type: castModEventType(event),
    mod: event.user.id,
    reason: event.options.getString("razon", false) || null,
    target: event.options.getUser("cuenta", true).id,
    expiresAt: castExpirationDate(event),
  };
}

function replyValidationError(event: CommandInteraction, error: string): Promise<void> {
  return event.reply({
    ephemeral: true,
    embeds: [
      createToast({
        title: "Error al aplicar la acción",
        description: error,
        severity: "error",
        target: event.user,
      }),
    ],
  });
}

export default class ModCommand implements CommandInteractionHandler {
  name = "mod";

  async handle(event: CommandInteraction): Promise<void> {
    const valid = await isValidModInteraction(event);
    if (valid) {
      const modEvent = translateInteractionToModEvent(event);
      await applyAction(event.client as Makibot, modEvent)
        .then(async (persisted) => {
          await notifyModlog(event.client as Makibot, persisted);
          replyModerator(event);
        })
        .catch((e: Error) => replyValidationError(event, e.message));
    } else {
      replyNonModerator(event);
    }
  }
}
