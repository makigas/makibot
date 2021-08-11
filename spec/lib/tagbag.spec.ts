import * as chai from "chai";
import "mocha";
import { stub } from "sinon";
import sinonChai from "sinon-chai";

import { SettingProvider } from "../../src/lib/provider";
import { Guild } from "discord.js";

import TagBag from "../../src/lib/tagbag";

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

const guild = {
  id: "1122334455",
} as Guild;

describe("TagBag", () => {
  describe("#tag", () => {
    it("can be used to access a tag bound to the snowflake", () => {
      const provider = mockSettingProvider(5);
      const bag = new TagBag(provider, "12345678901234567890");
      expect(bag.tag("foobar").get("default")).to.equal(5);
      expect(provider.get).to.have.been.calledOnceWith(
        "global",
        "12345678901234567890:foobar",
        "default"
      );
    });

    it("memoizes tags but still allows accessing them multiple times", () => {
      const provider = mockSettingProvider(5);
      const bag = new TagBag(provider, "12345678901234567890");
      expect(bag.tag("foobar").get("default")).to.equal(5);
      expect(bag.tag("foobar").get("newDefault")).to.equal(5);
      expect(provider.get).to.have.been.calledTwice;
      expect(provider.get).to.have.been.calledWith(
        "global",
        "12345678901234567890:foobar",
        "default"
      );
      expect(provider.get).to.have.been.calledWith(
        "global",
        "12345678901234567890:foobar",
        "newDefault"
      );
    });

    it("can modify the value of a tag", async () => {
      const provider = mockSettingProvider(5);
      const bag = new TagBag(provider, "12345678901234567890");
      expect(bag.tag("foobar").get("default")).to.equal(5);
      await bag.tag("foobar").set(10);
      expect(provider.get).to.have.been.calledOnceWith(
        "global",
        "12345678901234567890:foobar",
        "default"
      );
      expect(provider.set).to.have.been.calledOnceWith("global", "12345678901234567890:foobar", 10);
    });

    it("can be used to access a tag bound to a specific guild", () => {
      const provider = mockSettingProvider(5);
      const bag = new TagBag(provider, "12345678901234567890", guild);
      expect(bag.tag("foobar").get("default")).to.equal(5);
      expect(provider.get).to.have.been.calledOnceWith(
        "1122334455",
        "12345678901234567890:foobar",
        "default"
      );
    });
  });

  describe("#counter", () => {
    it("can be used to access a counter bound to the snowflake", () => {
      const provider = mockSettingProvider(5);
      const bag = new TagBag(provider, "12345678901234567890");
      expect(bag.counter("points", { initial: 0 }).get()).to.equal(5);
      expect(provider.get).to.have.been.calledOnceWith("global", "12345678901234567890:points", 0);
    });

    it("can be used to access a counter bound to a specific guild", () => {
      const provider = mockSettingProvider(5);
      const bag = new TagBag(provider, "12345678901234567890", guild);
      expect(bag.counter("points", { initial: 0 }).get()).to.equal(5);
      expect(provider.get).to.have.been.calledOnceWith(
        "1122334455",
        "12345678901234567890:points",
        0
      );
    });
  });
});
