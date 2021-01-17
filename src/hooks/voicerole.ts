import { Hook } from "../lib/hook";
import Makibot from "../Makibot";
import VoiceRole from "discordjs-voicerole";
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

  private voicerole: VoiceRole;

  constructor(private client: Makibot) {
    this.client.on("voiceStateUpdate", (oldState, newState) => {
      /*
       * TODO: I have to create a manager on each event because I cannot update otherwise the
       * config if I let it be a property of the service. Hooks should have the ability to
       * be restarted or reloaded. Wait, this hook system is getting more complicated!
       */
      const voiceRoleConfig = client.provider.get(null, "voiceroles", {});
      this.voicerole = new VoiceRole(voiceRoleConfig);
      if (oldState.member.id != newState.member.id) {
        logger.error(`Unexpected condition: ${tag(oldState)} != ${tag(newState)}`);
        return;
      }
      if (oldState.channelID && newState.channelID) {
        logger.debug(
          `Member ${tag(oldState)} changes channel: ${channel(oldState)} => ${channel(newState)}`
        );
      } else if (!oldState.channelID) {
        logger.debug(`Member ${tag(newState)} connected from ${channel(newState)}`);
      } else if (!newState.channelID) {
        logger.debug(`Member ${tag(oldState)} disconnected from ${channel(oldState)}`);
      }
      this.voicerole.trigger(oldState, newState);
    });
  }
}
