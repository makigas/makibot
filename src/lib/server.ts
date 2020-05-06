import { Guild, Role, TextChannel } from "discord.js";
import Makibot from "../Makibot";
import Settings from "./settings";

export default class Server {
  constructor(private guild: Guild) {}

  private getRoleByName(name: string): Role {
    if (!name) {
      return null;
    }
    return this.guild.roles.find((role) => role.name === name) || null;
  }

  private getRoleByID(id: string): Role {
    if (!id) {
      return null;
    }
    return this.guild.roles.find((role) => role.id === id) || null;
  }

  private getTextChannelByName(name: string): TextChannel {
    if (!name) {
      const channel = this.guild.channels.find((channel) => channel.name === name);
      if (channel && channel.type === "text") {
        return channel as TextChannel;
      } else {
        return null;
      }
    }
  }

  private getTextChannelByID(id: string): TextChannel {
    if (!id) {
      const channel = this.guild.channels.find((channel) => channel.id === id);
      if (channel && channel.type === "text") {
        return channel as TextChannel;
      } else {
        return null;
      }
    }
  }

  get settings(): Settings {
    return new Settings(this.guild);
  }

  get helperRole(): Role {
    const helperRoleName = process.env.HELPER_ROLE || "helpers";
    return this.getRoleByName(helperRoleName);
  }

  get modsRole(): Role {
    const modsRoleName = process.env.MODS_ROLE || "mods";
    return this.getRoleByName(modsRoleName);
  }

  get verifiedRole(): Role {
    const verifiedRoleName = process.env.VERIFY_ROLE || "verified";
    return this.getRoleByName(verifiedRoleName);
  }

  get warnRole(): Role {
    const warnRoleName = process.env.WARN_ROLE || "warn";
    return this.getRoleByName(warnRoleName);
  }

  get publicModlogChannel(): TextChannel {
    const modlogChannelName = process.env.PUBLIC_MODLOG_CHANNEL || "public-modlog";
    return this.getTextChannelByName(modlogChannelName);
  }

  get modlogChannel(): TextChannel {
    return this.getTextChannelByID(process.env.MODLOG);
  }

  get captchasChannel(): TextChannel {
    const captchasChannelName = process.env.VERIFY_CHANNEL || "captchas";
    return this.getTextChannelByName(captchasChannelName);
  }

  get pinboardChannel(): TextChannel {
    const pinboardChannelName = this.settings.pinPinboard;
    return this.getTextChannelByName(pinboardChannelName);
  }
}
