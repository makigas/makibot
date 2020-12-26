import * as chai from "chai";
import "mocha";
import { SinonStub, stub } from "sinon";
import sinonChai from "sinon-chai";

import { SettingProvider } from "discord.js-commando";
import { Guild } from "discord.js";

import Tag from "../../src/lib/tag";

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
      let tag = new Tag(provider, "myKey", { guild: guild as Guild });
      expect(tag.get("defaultValue")).to.equal("myValue");
      expect(provider.get).to.have.been.calledOnceWith("1122334455", "myKey", "defaultValue");
    });

    describe("when the tag has a TTL", () => {
      let now: SinonStub;

      let mockProvider: SettingProvider;

      beforeEach(() => {
        now = stub(Date, "now").returns(5000000);
        mockProvider = mockSettingProvider(10);
        mockProvider.get = function (_guild, key, _defVal) {
          if (key.endsWith("::updatedAt")) {
            return 4500000;
          } else {
            return 10;
          }
        };
      });

      afterEach(() => {
        now.restore();
      });

      it("returns the proper value if the TTL has not expired yet", () => {
        let tag = new Tag(mockProvider, "myKey", { ttl: 800 });
        expect(tag.get("defaultValue")).to.eq(10);
      });

      it("returns the default value if the TTL has expired already", () => {
        let tag = new Tag(mockProvider, "myKey", { ttl: 400 });
        expect(tag.get("defaultValue")).to.eq("defaultValue");
      });
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

      let tag = new Tag(provider, "myKey", { guild: guild as Guild });
      await tag.set("fooBar");
      expect(provider.set).to.have.been.calledOnceWith("1122334455", "myKey", "fooBar");
    });

    describe("when the tag has a TTL", () => {
      let now: SinonStub;

      beforeEach(() => {
        now = stub(Date, "now").returns(5000000);
      });

      afterEach(() => {
        now.restore();
      });

      it("also saves the time at which the tag is updated", async () => {
        let provider = mockSettingProvider();

        let tag = new Tag(provider, "myKey", { ttl: 500 });
        await tag.set("fooBar");
        expect(provider.set).to.have.been.calledWith("global", "myKey", "fooBar");
        expect(provider.set).to.have.been.calledWith("global", "myKey::updatedAt", 5000000);
      });
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

      let tag = new Tag(provider, "myKey", { guild: guild as Guild });
      await tag.delete();
      expect(provider.remove).to.have.been.calledOnceWith("1122334455", "myKey");
    });

    describe("when the tag has a TTL", () => {
      it("also tries to delete the time at which the tag was updated", async () => {
        let provider = mockSettingProvider();

        let tag = new Tag(provider, "myKey", { ttl: 500 });
        await tag.delete();
        expect(provider.remove).to.have.been.calledWith("global", "myKey");
        expect(provider.remove).to.have.been.calledWith("global", "myKey::updatedAt");
      });
    });
  });
});
