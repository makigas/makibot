import { Hook } from "../lib/hook";
import Makibot from "../Makibot";
import { VoiceRoleManager } from "discordjs-voicerole";
import logger from "../lib/logger";
import { VoiceState } from "discord.js";

function tag(voice: VoiceState): string {
  return `${voice.member.user.tag}(${voice.member.id})`;
}

function channel(voice: VoiceState): string {
  return `${voice.channel.name}(${voice.channel.id})`;
}

export default class VoiceRoleService implements Hook {
  name = "voice-role";

  allowsRestart = true;

  private voicerole: VoiceRoleManager;

  constructor(private client: Makibot) {
    const voiceRoleConfig = client.provider.get(null, "voiceroles", {});
    this.voicerole = new VoiceRoleManager(voiceRoleConfig);
  }

  onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (oldState.member.id != newState.member.id) {
      logger.error(`Unexpected condition: ${tag(oldState)} != ${tag(newState)}`);
      return;
    }
    if (oldState.channelId === newState.channelId) {
      /* The user simply changed their local state without changing channels. */
      return;
    }
    if (oldState.channelId && newState.channelId) {
      logger.debug(
        `Member ${tag(oldState)} changes channel: ${channel(oldState)} => ${channel(newState)}`
      );
    } else if (!oldState.channelId) {
      logger.debug(`Member ${tag(newState)} connected from ${channel(newState)}`);
    } else if (!newState.channelId) {
      logger.debug(`Member ${tag(oldState)} disconnected from ${channel(oldState)}`);
    }
    this.voicerole.trigger(oldState, newState);
  }

  restart(): void {
    const voiceRoleConfig = this.client.provider.get(null, "voiceroles", {});
    this.voicerole = new VoiceRoleManager(voiceRoleConfig);
  }
}
