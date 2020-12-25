import * as chai from "chai";
import "mocha";
import { mock } from "sinon";
import sinonChai from "sinon-chai";

import { SettingProvider } from "discord.js-commando";
import { Guild } from "discord.js";

import Tag from "../../src/lib/tag";

const expect = chai.expect;
chai.use(sinonChai);

function mockSettingProvider(returns: any = undefined): SettingProvider {
  let fakeSettingProvider = {
    get: mock().returns(returns),
    set: mock().returns(Promise.resolve(returns)),
    remove: mock().returns(Promise.resolve()),
  };
  return (fakeSettingProvider as unknown) as SettingProvider;
}

describe("Tag", () => {
  let guild = { id: "1122334455" };

  describe("#get", () => {
    it("retrieves a global setting", () => {
      let provider = mockSettingProvider("myValue");
      let tag = new Tag(provider, "myKey");
      expect(tag.get("defaultValue")).to.equal("myValue");
      expect(provider.get).to.have.been.calledOnceWith("global", "myKey", "defaultValue");
    });

    it("retrieves a local setting", () => {
      let provider = mockSettingProvider("myValue");
      let tag = new Tag(provider, "myKey", guild as Guild);
      expect(tag.get("defaultValue")).to.equal("myValue");
      expect(provider.get).to.have.been.calledOnceWith("1122334455", "myKey", "defaultValue");
    });
  });
  describe("#set", () => {
    it("updates a global setting", async () => {
      let provider = mockSettingProvider();

      let tag = new Tag(provider, "myKey");
      await tag.set("fooBar");
      expect(provider.set).to.have.been.calledOnceWith("global", "myKey", "fooBar");
    });

    it("updates a local setting", async () => {
      let provider = mockSettingProvider();

      let tag = new Tag(provider, "myKey", guild as Guild);
      await tag.set("fooBar");
      expect(provider.set).to.have.been.calledOnceWith("1122334455", "myKey", "fooBar");
    });
  });

  describe("#delete", () => {
    it("deletes a global setting", async () => {
      let provider = mockSettingProvider();

      let tag = new Tag(provider, "myKey");
      await tag.delete();
      expect(provider.remove).to.have.been.calledOnceWith("global", "myKey");
    });

    it("deletes a local setting", async () => {
      let provider = mockSettingProvider();

      let tag = new Tag(provider, "myKey", guild as Guild);
      await tag.delete();
      expect(provider.remove).to.have.been.calledOnceWith("1122334455", "myKey");
    });
  });
});
