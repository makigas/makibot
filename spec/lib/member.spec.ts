import * as chai from "chai";
import { Guild, GuildMember } from "discord.js";
import "mocha";
import Member from "../../src/lib/member";
import { stub } from "sinon";
import sinonChai from "sinon-chai";
import { SettingProvider } from "../../src/lib/provider";
import Makibot from "../../src/Makibot";

const expect = chai.expect;
chai.use(sinonChai);

function mockSettingProvider(returns: any = undefined): SettingProvider {
  let fakeSettingProvider = {
    get: stub().returns(returns),
    set: stub().returns(Promise.resolve(returns)),
    remove: stub().returns(Promise.resolve()),
  };
  return fakeSettingProvider as unknown as SettingProvider;
}

describe("Member", () => {
  const fakeClient = {
    provider: mockSettingProvider(10),
  } as Makibot;
  const fakeGuild = {
    id: "g112233",
    client: fakeClient,
  } as unknown as Guild;
  const fakeGuildMember = {
    id: "gm112233",
    guild: fakeGuild,
    client: fakeClient,
  } as unknown as GuildMember;

  describe("#tagbag", () => {
    it("can be used to bind tags to the member", () => {
      let member = new Member(fakeGuildMember);
      expect(member.tagbag.tag("score").get(5)).to.equal(10);
      expect(fakeClient.provider.get).to.have.been.calledOnceWith("g112233", "gm112233:score", 5);
    });
  });
});
