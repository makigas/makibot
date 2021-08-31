import { expect } from "chai";
import "mocha";
import { containsSpamLink } from "../../src/hooks/csgo";

describe("antispam system", () => {
  describe("trigger rules", () => {
    it("catches obvious", () => {
      expect(containsSpamLink("for example dlscord.gifts is spam")).to.be.true;
    });

    it("handles odd domains", () => {
      expect(containsSpamLink("discordapp.click is a fake site")).to.be.true;
      expect(containsSpamLink("discordapp.com is a safe site")).to.be.false;
      expect(containsSpamLink("but media.discordapp.net should be safe")).to.be.false;
      expect(containsSpamLink("watch out for media.discordapp.nitro !!")).to.be.true;
    });

    it("handles free text strings", () => {
      expect(containsSpamLink("click here to get 3 months for free")).to.be.true;
    });

    it("bans any domain containing .ru", () => {
      expect(containsSpamLink("checkout http://example.ru/spam")).to.be.true;
    });
  });
});