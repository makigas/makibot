import * as chai from "chai";
import "mocha";
import { SinonStub, stub } from "sinon";
import chaiAsPromise from "chai-as-promised";
import sinonChai from "sinon-chai";

import { SettingProvider } from "../../src/lib/provider";
import { Guild } from "discord.js";

import Tag from "../../src/lib/tag";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromise);

function mockSettingProvider<T>(returns?: T | undefined): SettingProvider {
  const fakeSettingProvider = {
    get: stub().returns(Promise.resolve(returns)),
    set: stub().returns(Promise.resolve(returns)),
    remove: stub().returns(Promise.resolve()),
  };
  return fakeSettingProvider as unknown as SettingProvider;
}

describe("Tag", () => {
  const guild = { id: "1122334455" };

  describe("#get", () => {
    it("retrieves a global setting", () => {
      const provider = mockSettingProvider("myValue");
      const tag = new Tag(provider, "myKey");
      expect(tag.get("defaultValue")).to.eventually.equal("myValue");
      expect(provider.get).to.have.been.calledOnceWith("global", "myKey", "defaultValue");
    });

    it("retrieves a local setting", () => {
      const provider = mockSettingProvider("myValue");
      const tag = new Tag(provider, "myKey", guild as Guild);
      expect(tag.get("defaultValue")).to.eventually.equal("myValue");
      expect(provider.get).to.have.been.calledOnceWith("1122334455", "myKey", "defaultValue");
    });
  });
  describe("#set", () => {
    it("updates a global setting", async () => {
      const provider = mockSettingProvider();

      const tag = new Tag(provider, "myKey");
      await tag.set("fooBar");
      expect(provider.set).to.have.been.calledOnceWith("global", "myKey", "fooBar");
    });

    it("updates a local setting", async () => {
      const provider = mockSettingProvider();

      const tag = new Tag(provider, "myKey", guild as Guild);
      await tag.set("fooBar");
      expect(provider.set).to.have.been.calledOnceWith("1122334455", "myKey", "fooBar");
    });
  });

  describe("#delete", () => {
    it("deletes a global setting", async () => {
      const provider = mockSettingProvider();

      const tag = new Tag(provider, "myKey");
      await tag.delete();
      expect(provider.remove).to.have.been.calledOnceWith("global", "myKey");
    });

    it("deletes a local setting", async () => {
      const provider = mockSettingProvider();

      const tag = new Tag(provider, "myKey", guild as Guild);
      await tag.delete();
      expect(provider.remove).to.have.been.calledOnceWith("1122334455", "myKey");
    });
  });
});
