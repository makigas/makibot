import * as chai from "chai";
import { Guild } from "discord.js";
import "mocha";
import { stub } from "sinon";
import sinonChai from "sinon-chai";
import { CommandoClient, SettingProvider } from "discord.js-commando";
import Server from "../../src/lib/server";

const expect = chai.expect;
chai.use(sinonChai);

function mockSettingProvider(returns: any = undefined): SettingProvider {
  let fakeSettingProvider = {
    get: stub().returns(returns),
    set: stub().returns(Promise.resolve(returns)),
    remove: stub().returns(Promise.resolve()),
  };
  return (fakeSettingProvider as unknown) as SettingProvider;
}

describe("Server", () => {
  const fakeClient = {
    provider: mockSettingProvider(10),
  } as CommandoClient;
  const fakeGuild = ({
    id: "g112233",
    client: fakeClient,
  } as unknown) as Guild;
  describe("#tagbag", () => {
    it("can be used to bind tags to a server", () => {
      let server = new Server(fakeGuild);
      expect(server.tagbag.tag("users").get(5)).to.equal(10);
      expect(fakeClient.provider.get).to.have.been.calledOnceWith("g112233", "g112233:users", 5);
    });
  });
});
