import { expect } from "chai";
import "mocha";
import { containsSpamLink, isAirdrop } from "../../src/hooks/csgo";

describe("antispam system", () => {
  describe("isAirdrop", () => {
    it("catches examples", () => {
      const cases = [
        "@everyone NEW Discord nitro AIRDROP FROM STEAM - https://discord.com",
        "@everyone\nAirdrop Discord NITRO with Steam\nhttps://discord.com",
        "@everyone Discord Nitro for Free - Steam Store Discord nitro distribution Get 3 monts of Discord Nitro. Offer ends September 5, 2021 at 11 am EDT, Personalize your profile, screen share in HD, upgrade your emojis, and more!https://discord.com",
        "@everyone\nDistribution of nitro from STEAM.\nGet 3 Months of Nitro Discord. Hurry up the offer ends on August 31, 2021 at 11:00 am ET. Customize your profile, share your HD screen, boost your server, update your emojis, and more! https://discord.com",
        "airdrop discord nitro by steam, take it https://example.com/spambot",
      ];

      for (const strcase of cases) {
        expect(isAirdrop(strcase)).to.be.true;
      }
    });
  });

  describe("trigger rules", () => {
    it("catches obvious", () => {
      expect(containsSpamLink("for example dlscord.gifts is spam")).to.be.true;
    });

    it("handles odd domains", () => {
      expect(containsSpamLink("discordapp.click is a fake site")).to.be.true;
      expect(containsSpamLink("discordapp-click is a fake site")).to.be.false;
      expect(containsSpamLink("discordapp.com is a safe site")).to.be.false;
      expect(containsSpamLink("but media.discordapp.net should be safe")).to.be.false;
      expect(containsSpamLink("watch out for media.discordapp.nitro !!")).to.be.true;
      expect(containsSpamLink("visit discord-app.com/foo for your prize")).to.be.true;
      expect(containsSpamLink("visit discord-appAcom/foo for your prize")).to.be.false;
    });

    it("handles free text strings", () => {
      expect(containsSpamLink("click here to get 3 months for free")).to.be.true;
    });

    it("bans any domain containing .ru", () => {
      expect(containsSpamLink("checkout http://example.ru/spam")).to.be.true;
      expect(containsSpamLink("checkout http://example.guru/spam")).to.be.false;
    });
  });
});
