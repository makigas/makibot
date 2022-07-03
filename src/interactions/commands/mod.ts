import { CommandInteraction, UserResolvable } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { applyAction } from "../../lib/modlog/actions";
import { notifyModlog } from "../../lib/modlog/notifications";
import { ModEvent, ModEventType } from "../../lib/modlog/types";
import { createToast } from "../../lib/response";
import { tokenToDate } from "datetoken";
import Server from "../../lib/server";
import Makibot from "../../Makibot";
import Member from "../../lib/member";
import { SlashCommandBuilder } from "@discordjs/builders";

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

  build() {
    return new SlashCommandBuilder()
      .setName("mod")
      .setDescription("Ejecutar una acción de moderación")
      .setDefaultPermission(false)
      .addSubcommand((command) =>
        command
          .setName("bless")
          .setDescription("Limpia el estado de moderación de una cuenta")
          .addUserOption((option) =>
            option
              .setName("cuenta")
              .setDescription("La cuenta que será llamada la atención")
              .setRequired(true)
          )
      )
      .addSubcommand((command) =>
        command
          .setName("mute")
          .setDescription("Silencia una cuenta en este servidor")
          .addUserOption((option) =>
            option
              .setName("cuenta")
              .setDescription("La cuenta que será silenciada")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option.setName("razon").setDescription("La razón por la que se silencia a esta cuenta")
          )
          .addStringOption((option) =>
            option
              .setName("duracion")
              .setDescription("El vencimiento de este silencio")
              .setChoices(
                { name: "hora", value: "now+h" },
                { name: "dia", value: "now+d" },
                { name: "semana", value: "now+w" }
              )
          )
      )
      .addSubcommand((command) =>
        command
          .setName("unmute")
          .setDescription("Anula un silencio en este servidor")
          .addUserOption((option) =>
            option
              .setName("cuenta")
              .setDescription("La cuenta a la que se le quita el silencio")
              .setRequired(true)
          )
      )
      .addSubcommand((command) =>
        command
          .setName("ban")
          .setDescription("Banea a una persona del servidor (ya no puede entrar)")
          .addUserOption((option) =>
            option
              .setName("cuenta")
              .setDescription("La cuenta a la que se va a echar del servidor")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option.setName("razon").setDescription("La razón por la que se banea a esta persona")
          )
      )
      .addSubcommand((command) =>
        command
          .setName("kick")
          .setDescription("Echa a una persona del servidor (puede volver a entrar)")
          .addUserOption((option) =>
            option
              .setName("cuenta")
              .setDescription("La cuenta a la que se va a echar del servidor")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option.setName("razon").setDescription("La razón por la que se echa a esta persona")
          )
      )
      .addSubcommand((command) =>
        command
          .setName("warn")
          .setDescription("Llama la atención a una cuenta de este servidor")
          .addUserOption((option) =>
            option
              .setName("cuenta")
              .setDescription("La cuenta que será llamada la atención")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("razon")
              .setDescription("La razón por la que se llama la atención a esta cuenta")
          )
          .addStringOption((option) =>
            option
              .setName("duracion")
              .setDescription("El vencimiento de esta llamada de atención")
              .setChoices(
                { name: "hora", value: "now+h" },
                { name: "dia", value: "now+d" },
                { name: "semana", value: "now+w" }
              )
          )
      )
      .addSubcommand((command) =>
        command
          .setName("unwarn")
          .setDescription("Anula una llamada de atención en este servidor")
          .addUserOption((option) =>
            option
              .setName("cuenta")
              .setDescription("La cuenta a la que se le quita la llamada de atención")
              .setRequired(true)
          )
      );
  }

  handleGuild(event: CommandInteraction): Promise<void> {
    if (isModerationCommand(event)) {
      return this.handleModeration(event);
    } else if (isBlessCommand(event)) {
      return this.handleBless(event);
    }
  }

  private async handleModeration(event: CommandInteraction): Promise<void> {
    const valid = await isValidModInteraction(event);
    if (valid) {
      const modEvent = translateInteractionToModEvent(event);
      await applyAction(event.client as Makibot, modEvent)
        .then(async (persisted) => {
          if (modEvent.type !== "BAN" && modEvent.type !== "KICK") {
            await notifyModlog(event.client as Makibot, persisted);
          }
          replyModerator(event);
        })
        .catch((e: Error) => replyValidationError(event, e.message));
    } else {
      replyNonModerator(event);
    }
  }

  private async handleBless(event: CommandInteraction): Promise<void> {
    const targetAccount = event.options.get("cuenta", true).value as string;
    const member = await getMember(event, targetAccount);
    await member.bless();

    await event.reply({
      ephemeral: true,
      embeds: [
        createToast({
          title: "Cuenta limpiada",
          description: "Has limpiado la memoria de moderación de esta persona.",
          severity: "success",
          target: member.user,
        }),
      ],
    });
  }
}

function getMember(event: CommandInteraction, user: UserResolvable): Promise<Member> {
  const server = new Server(event.guild);
  return server.member(user);
}

function isModerationCommand(event: CommandInteraction): boolean {
  const choices = ["warn", "unwarn", "mute", "unmute", "kick", "ban"];
  const commandName = event.options.getSubcommand(true);
  return choices.includes(commandName);
}

function isBlessCommand(event: CommandInteraction): boolean {
  return event.options.getSubcommand() === "bless";
}
