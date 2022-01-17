import { expect } from "chai";
import "mocha";
import { matchesUrlInRuleset } from "../../src/hooks/antispam";

describe("antispam", () => {
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
