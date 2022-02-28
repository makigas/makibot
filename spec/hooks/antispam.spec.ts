import { expect } from "chai";
import { Message } from "discord.js";
import "mocha";
import { isRussianPropaganda, matchesUrlInRuleset } from "../../src/hooks/antispam";

function genMessage(str: string): Message {
  return { content: str, cleanContent: str } as Message;
}

describe("antispam", () => {
  describe("#isRussianPropaganda", () => {
    it("catches URLs", () => {
      const trueCases = [
        "lo podeis ver aqui https://actualidad.rt.com/1234",
        "yo me informo desde https://actualidad.rt.com",
        "mira esto https://mundo.sputniknews.com/12345",
        "linking in english to http://rt.com",
      ];
      const falseCases = ["has probado a buscar en https://google.com"];
      for (const trueCase of trueCases) {
        expect(isRussianPropaganda(genMessage(trueCase))).to.be.true;
      }
      for (const falseCase of falseCases) {
        expect(isRussianPropaganda(genMessage(falseCase))).to.be.false;
      }
    });
  });

  describe("#matchesUrlInRuleset", () => {
    describe("for Twitch", () => {
      it("detects passing links to channels", () => {
        const cases = [
          "follow me on twitch https://twitch.tv/twitch !!",
          "channel here https://twitch.tv/twitch/videos !!",
        ];
        for (const str of cases) {
          expect(matchesUrlInRuleset(str)).not.to.be.undefined;
        }
      });

      it("has videos and clips as exception", () => {
        const cases = [
          "did you see this? https://www.twitch.tv/danirod_/clip/AgreeableBrightKeyboardShazBotstix-ajiKrPZ2WycnYOeM?filter=clips&range=all&sort=time",
          "here is the vod https://www.twitch.tv/videos/1196913534",
        ];
        for (const str of cases) {
          expect(matchesUrlInRuleset(str)).to.be.undefined;
        }
      });
    });
  });
});
