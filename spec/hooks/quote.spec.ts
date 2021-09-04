import { expect } from "chai";
import "mocha";
import { parseMessageReference } from "../../src/hooks/quote";

describe("quote service", () => {
  describe("#parseMessageReference", () => {
    it("ignores messages without a permalink", () => {
      const input = "there is no permalink here";
      expect(parseMessageReference(input)).to.be.null;
    });

    it("gets the permalink right", () => {
      const input = "checkout this https://discord.com/channels/1234/5678/9012";
      const response = parseMessageReference(input);
      expect(response).not.to.be.null;
      expect(response).to.have.lengthOf(3);
      expect(response).to.deep.equal(["1234", "5678", "9012"]);
    });

    it("supports ptb", () => {
      const input = "checkout this https://ptb.discord.com/channels/1234/5678/9012";
      const response = parseMessageReference(input);
      expect(response).not.to.be.null;
      expect(response).to.have.lengthOf(3);
      expect(response).to.deep.equal(["1234", "5678", "9012"]);
    });

    it("supports canary", () => {
      const input = "checkout this https://canary.discord.com/channels/1234/5678/9012";
      const response = parseMessageReference(input);
      expect(response).not.to.be.null;
      expect(response).to.have.lengthOf(3);
      expect(response).to.deep.equal(["1234", "5678", "9012"]);
    });
  });
});
