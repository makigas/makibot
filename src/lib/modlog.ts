import { GuildMember, Message, User, PartialGuildMember, EmbedField } from "discord.js";
import { userMention, channelMention } from "@discordjs/builders";
import humanizeDuration from "humanize-duration";

export interface ModlogEvent {
  title: string;
  icon: string;
  color: number;
  fields: EmbedField[];
}

export const newJoinEvent = (member: GuildMember): ModlogEvent => ({
  title: "Nuevo miembro del servidor",
  icon: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/247/bright-button_1f506.png",
  color: 0xfeaf40,
  fields: [
    {
      name: "Miembro",
      value: userMention(member.user.id),
      inline: true,
    },
    {
      name: "User ID",
      value: member.user.id,
      inline: true,
    },
  ],
});

export const newVerifyEvent = (member: GuildMember): ModlogEvent => ({
  title: "Miembro ha sido verificado",
  icon: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/248/check-box-with-check_2611.png",
  color: 0x5a7702,
  fields: [
    {
      name: "Miembro",
      value: userMention(member.user.id),
      inline: true,
    },
    {
      name: "User ID",
      value: member.user.id,
      inline: true,
    },
    {
      name: "Se unió al servidor",
      value: member.joinedAt?.toUTCString(),
      inline: true,
    },
  ],
});

export const newLeaveEvent = (member: PartialGuildMember): ModlogEvent => ({
  title: "Abandono del servidor",
  icon: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/247/cross-mark_274c.png",
  color: 0xdd3247,
  fields: [
    {
      name: "Miembro",
      value: userMention(member.user.id),
      inline: true,
    },
    {
      name: "User ID",
      value: member.user.id,
      inline: true,
    },
  ],
});

export const newBanEvent = (user: User): ModlogEvent => ({
  title: "Miembro ha sido baneado",
  icon: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/248/hammer_1f528.png",
  color: 0x3a3737,
  fields: [
    {
      name: "Miembro",
      value: userMention(user.id),
      inline: true,
    },
    {
      name: "User ID",
      value: user.id,
      inline: true,
    },
  ],
});

export const newWarnEvent = (
  member: GuildMember,
  duration: number,
  { reason, message }: { reason: string; message: Message }
): ModlogEvent => {
  const fields: EmbedField[] = [
    {
      name: "Miembro",
      value: userMention(member.id),

      inline: true,
    },
    {
      name: "Duración",
      value: humanizeDuration(duration, {
        language: "es",
        fallbacks: ["en"],
      }),
      inline: true,
    },
  ];
  if (reason) {
    fields.push({
      name: "Razón",
      value: reason,
      inline: false,
    });
  }
  if (message) {
    fields.push(
      {
        name: "Canal",
        value: channelMention(message.channel.id),
        inline: true,
      },
      {
        name: "Fecha del mensaje",
        value: message.createdAt.toISOString(),
        inline: true,
      },
      {
        name: "Mensaje",
        value: message.cleanContent,
        inline: false,
      },
      {
        name: "URL",
        value: `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
        inline: false,
      }
    );
  }

  return {
    title: "Se ha aplicado un warn",
    icon: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/247/warning_26a0.png",
    color: 0x9b59b6,
    fields,
  };
};

export const newWastebinModlogEvent = (message: Message): ModlogEvent => ({
  title: "Se ha eliminado un mensaje",
  icon: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/248/wastebasket_1f5d1.png",
  color: 0x9b9b9b,
  fields: [
    {
      name: "Miembro",
      value: userMention(message.member.id),
      inline: true,
    },
    {
      name: "Canal",
      value: channelMention(message.channel.id),
      inline: true,
    },
    {
      name: "Mensaje",
      value: message.cleanContent,
      inline: false,
    },
    {
      name: "Fecha del mensaje",
      value: message.createdAt.toISOString(),
      inline: true,
    },
  ],
});
