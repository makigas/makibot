import { expect } from "chai";
import { ApplicationCommandOptionType } from "discord-api-types";
import "mocha";
import { parseCommandArguments } from "../../../src/interactions/commands/responder";

describe("parseCommandArguments", () => {
  describe("parameter lists", () => {
    it("parses for empty", () => {
      expect(parseCommandArguments("")).to.have.length(0);
    });

    it("parses for single", () => {
      expect(parseCommandArguments("name:string")).to.have.length(1);
    });

    it("parses for multiple", () => {
      expect(parseCommandArguments("name:string level:integer verified:boolean")).to.have.length(3);
    });
  });

  describe("data types mapping", () => {
    it("maps for strings", () => {
      const response = parseCommandArguments("name:string");
      expect(response[0]).to.deep.eq({
        name: "name",
        description: "name",
        type: ApplicationCommandOptionType.STRING,
      });
    });

    it("maps for integer", () => {
      const response = parseCommandArguments("level:integer");
      expect(response[0]).to.deep.eq({
        name: "level",
        description: "level",
        type: ApplicationCommandOptionType.INTEGER,
      });
    });

    it("maps for boolean", () => {
      const response = parseCommandArguments("verified:boolean");
      expect(response[0]).to.deep.eq({
        name: "verified",
        description: "verified",
        type: ApplicationCommandOptionType.BOOLEAN,
      });
    });

    it("maps for user", () => {
      const response = parseCommandArguments("target:user");
      expect(response[0]).to.deep.eq({
        name: "target",
        description: "target",
        type: ApplicationCommandOptionType.USER,
      });
    });

    it("maps for channel", () => {
      const response = parseCommandArguments("in:channel");
      expect(response[0]).to.deep.eq({
        name: "in",
        description: "in",
        type: ApplicationCommandOptionType.CHANNEL,
      });
    });

    it("maps for role", () => {
      const response = parseCommandArguments("team:role");
      expect(response[0]).to.deep.eq({
        name: "team",
        description: "team",
        type: ApplicationCommandOptionType.ROLE,
      });
    });

    it("maps for mentionable", () => {
      const response = parseCommandArguments("team:mentionable");
      expect(response[0]).to.deep.eq({
        name: "team",
        description: "team",
        type: ApplicationCommandOptionType.MENTIONABLE,
      });
    });
  });
});
