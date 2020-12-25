import * as chai from "chai";
import "mocha";
import { fake, mock } from "sinon";
import sinonChai from "sinon-chai";

import { Guild } from "discord.js";
import { SettingProvider } from "discord.js-commando";

import Counter from "../../src/lib/counter";

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

const guild = {
  id: "1122334455",
} as Guild;

describe("Counter", () => {
  describe("#get", () => {
    it("gets the value of a global setting", () => {
      const fakeProvider = mockSettingProvider(2);

      const counter = new Counter(fakeProvider, "fakeCounter", {
        initial: 5,
      });
      expect(counter.get()).to.equal(2);
      expect(fakeProvider.get).to.have.been.calledOnceWith("global", "fakeCounter", 5);
    });

    it("gets the value of a local setting", () => {
      const fakeProvider = mockSettingProvider(2);

      const counter = new Counter(fakeProvider, "fakeCounter", {
        guild,
        initial: 5,
      });
      expect(counter.get()).to.equal(2);
      expect(fakeProvider.get).to.have.been.calledOnceWith("1122334455", "fakeCounter", 5);
    });
  });

  describe("#set", () => {
    it("sets the value of a global setting", async () => {
      const fakeProvider = mockSettingProvider(2);

      const counter = new Counter(fakeProvider, "fakeCounter", {
        initial: 5,
      });
      await counter.set(8);
      expect(fakeProvider.set).to.have.been.calledOnceWith("global", "fakeCounter", 8);
    });

    it("sets the value of a local setting", async () => {
      const fakeProvider = mockSettingProvider(2);

      const counter = new Counter(fakeProvider, "fakeCounter", {
        guild,
        initial: 5,
      });
      await counter.set(8);
      expect(fakeProvider.set).to.have.been.calledOnceWith("1122334455", "fakeCounter", 8);
    });

    it("clamps values lower than the minimum accepted", async () => {
      const fakeProvider = mockSettingProvider();

      const counter = new Counter(fakeProvider, "fakeCounter", {
        initial: 5,
        min: 2,
      });
      await counter.set(1);
      expect(fakeProvider.set).to.have.been.calledOnceWith("global", "fakeCounter", 2);
    });

    it("clamps values higher than the minimum accepted", async () => {
      const fakeProvider = mockSettingProvider();

      const counter = new Counter(fakeProvider, "fakeCounter", {
        initial: 5,
        max: 10,
      });
      await counter.set(12);
      expect(fakeProvider.set).to.have.been.calledOnceWith("global", "fakeCounter", 10);
    });
  });

  describe("#inc", () => {
    it("increments the value of a global setting", async () => {
      const fakeProvider = mockSettingProvider(8);

      const counter = new Counter(fakeProvider, "fakeCounter", {
        initial: 5,
      });
      await counter.inc();
      expect(fakeProvider.set).to.have.been.calledOnceWith("global", "fakeCounter", 9);
    });

    it("increments the value of a local setting", async () => {
      const fakeProvider = mockSettingProvider(8);

      const counter = new Counter(fakeProvider, "fakeCounter", {
        guild,
        initial: 5,
      });
      await counter.inc();
      expect(fakeProvider.set).to.have.been.calledOnceWith("1122334455", "fakeCounter", 9);
    });

    it("clamps the value so that it never pass the maximum", async () => {
      const fakeProvider = mockSettingProvider(10);

      const counter = new Counter(fakeProvider, "fakeCounter", {
        initial: 5,
        max: 10,
      });
      await counter.inc();
      expect(fakeProvider.set).to.have.been.calledOnceWith("global", "fakeCounter", 10);
    });
  });

  describe("#dec", () => {
    it("decrements the value of a global setting", async () => {
      const fakeProvider = mockSettingProvider(8);

      const counter = new Counter(fakeProvider, "fakeCounter", {
        initial: 5,
      });
      await counter.dec();
      expect(fakeProvider.set).to.have.been.calledOnceWith("global", "fakeCounter", 7);
    });

    it("decrements the value of a local setting", async () => {
      const fakeProvider = mockSettingProvider(8);

      const counter = new Counter(fakeProvider, "fakeCounter", {
        guild,
        initial: 5,
      });
      await counter.dec();
      expect(fakeProvider.set).to.have.been.calledOnceWith("1122334455", "fakeCounter", 7);
    });

    it("clamps the value so that it never pass the minimum", async () => {
      const fakeProvider = mockSettingProvider(2);

      const counter = new Counter(fakeProvider, "fakeCounter", {
        initial: 5,
        min: 2,
      });
      await counter.dec();
      expect(fakeProvider.set).to.have.been.calledOnceWith("global", "fakeCounter", 2);
    });
  });

  describe("#delete", () => {
    it("deletes a global setting", async () => {
      const fakeProvider = mockSettingProvider(8);

      const counter = new Counter(fakeProvider, "fakeCounter");
      await counter.delete();
      expect(fakeProvider.remove).to.have.been.calledOnceWith("global", "fakeCounter");
    });

    it("deletes a local setting", async () => {
      const fakeProvider = mockSettingProvider(8);

      const counter = new Counter(fakeProvider, "fakeCounter", { guild });
      await counter.delete();
      expect(fakeProvider.remove).to.have.been.calledOnceWith("1122334455", "fakeCounter");
    });
  });
});
