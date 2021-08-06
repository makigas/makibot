import * as chai from "chai";
import "mocha";
import { SinonStub, stub } from "sinon";
import sinonChai from "sinon-chai";

import { Guild } from "discord.js";
import { SettingProvider } from "../../src/lib/provider";

import Counter from "../../src/lib/counter";

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

    describe("when the counter has a TTL", () => {
      let clock: SinonStub;

      beforeEach(() => {
        clock = stub(Date, "now").returns(5_000_000);
      });

      afterEach(() => {
        clock.restore();
      });

      it("queries returns the real value if the timer has not expired", () => {
        const fakeProvider = mockSettingProvider(2);
        fakeProvider.get = (_guild, key, _defVal) => (key.endsWith("::updatedAt") ? 4900000 : 2);

        const counter = new Counter(fakeProvider, "fakeCounter", {
          guild,
          initial: 5,
          ttl: 500,
          ttlStrategy: "TOUCH_ALWAYS",
        });
        expect(counter.get()).to.equal(2);
      });

      it("queries returns the default value if the timer has expired", () => {
        const fakeProvider = mockSettingProvider(2);
        fakeProvider.get = (_guild, key, _defVal) => (key.endsWith("::updatedAt") ? 4000000 : 2);

        const counter = new Counter(fakeProvider, "fakeCounter", {
          guild,
          initial: 5,
          ttl: 500,
          ttlStrategy: "TOUCH_ALWAYS",
        });
        expect(counter.get()).to.equal(5);
      });

      it("queries returns the default value if the timer does not exist", () => {
        const fakeProvider = mockSettingProvider(2);
        fakeProvider.get = (_guild, key, _defVal) => (key.endsWith("::updatedAt") ? 0 : 2);

        const counter = new Counter(fakeProvider, "fakeCounter", {
          guild,
          initial: 5,
          ttl: 500,
          ttlStrategy: "TOUCH_ALWAYS",
        });
        expect(counter.get()).to.equal(5);
      });
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

    describe("when TTL is set", () => {
      let clock: SinonStub;

      beforeEach(() => {
        clock = stub(Date, "now").returns(5_000_000);
      });

      afterEach(() => {
        clock.restore();
      });

      describe("using the TOUCH_FIRST strategy", () => {
        it("updates the timestamp if the timestamp was not set", async () => {
          const fakeProvider = mockSettingProvider();
          fakeProvider.get = (_guild, _key, defVal) => defVal;

          const counter = new Counter(fakeProvider, "fakeCounter", {
            initial: 5,
            ttl: 500,
            ttlStrategy: "TOUCH_FIRST",
          });
          await counter.set(2);
          expect(fakeProvider.set).to.have.been.calledWith("global", "fakeCounter", 2);
          expect(fakeProvider.set).to.have.been.calledWith(
            "global",
            "fakeCounter::updatedAt",
            5_000_000
          );
        });

        it("updates the timestamp if the timestamp was expired", async () => {
          const fakeProvider = mockSettingProvider();
          fakeProvider.get = (_guild, key, _defVal) =>
            key.endsWith("::updatedAt") ? 4_500_000 : 2;

          const counter = new Counter(fakeProvider, "fakeCounter", {
            initial: 5,
            ttl: 400,
            ttlStrategy: "TOUCH_FIRST",
          });
          await counter.set(2);
          expect(fakeProvider.set).to.have.been.calledWith("global", "fakeCounter", 2);
          expect(fakeProvider.set).to.have.been.calledWith(
            "global",
            "fakeCounter::updatedAt",
            5_000_000
          );
        });

        it("does not update the timestamp if the timestamp is not expired", async () => {
          const fakeProvider = mockSettingProvider();
          fakeProvider.get = (_guild, key, _defVal) =>
            key.endsWith("::updatedAt") ? 4_500_000 : 2;

          const counter = new Counter(fakeProvider, "fakeCounter", {
            initial: 5,
            ttl: 800,
            ttlStrategy: "TOUCH_FIRST",
          });
          await counter.set(2);
          expect(fakeProvider.set).to.have.been.calledWith("global", "fakeCounter", 2);
          expect(fakeProvider.set).not.to.have.been.calledWith(
            "global",
            "fakeCounter::updatedAt",
            5_000_000
          );
        });
      });

      describe("using the TOUCH_ALWAYS strategy", () => {
        it("updates the timestamp whenever the value is set", async () => {
          const fakeProvider = mockSettingProvider();

          const counter = new Counter(fakeProvider, "fakeCounter", {
            initial: 5,
            ttl: 500,
            ttlStrategy: "TOUCH_ALWAYS",
          });
          await counter.set(2);
          expect(fakeProvider.set).to.have.been.calledWith("global", "fakeCounter", 2);
          expect(fakeProvider.set).to.have.been.calledWith(
            "global",
            "fakeCounter::updatedAt",
            5_000_000
          );
        });
      });
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

    describe("when TTL is set", () => {
      let clock: SinonStub;

      beforeEach(() => {
        clock = stub(Date, "now").returns(5_000_000);
      });

      afterEach(() => {
        clock.restore();
      });

      describe("using the TOUCH_ALWAYS strategy", () => {
        it("updates the last update key when incremented", async () => {
          const fakeProvider = mockSettingProvider();
          fakeProvider.get = (_guild, key, _defVal) =>
            key.endsWith("::updatedAt") ? 4_900_000 : 8;

          const counter = new Counter(fakeProvider, "fakeCounter", {
            initial: 5,
            ttl: 500,
            ttlStrategy: "TOUCH_ALWAYS",
          });
          await counter.inc();
          expect(fakeProvider.set).to.have.been.calledWith("global", "fakeCounter", 9);
          expect(fakeProvider.set).to.have.been.calledWith(
            "global",
            "fakeCounter::updatedAt",
            5_000_000
          );
        });
      });

      describe("using the TOUCH_FIRST strategy", () => {
        it("updates the last update key when it did not exist", async () => {
          const fakeProvider = mockSettingProvider();
          fakeProvider.get = (_guild, _key, defVal) => defVal;

          const counter = new Counter(fakeProvider, "fakeCounter", {
            initial: 5,
            ttl: 500,
            ttlStrategy: "TOUCH_FIRST",
          });
          await counter.inc();
          expect(fakeProvider.set).to.have.been.calledWith("global", "fakeCounter", 6);
          expect(fakeProvider.set).to.have.been.calledWith(
            "global",
            "fakeCounter::updatedAt",
            5_000_000
          );
        });

        it("updates the last update key when it was expired", async () => {
          const fakeProvider = mockSettingProvider();
          fakeProvider.get = (_guild, key, defVal) => (key.endsWith("::updatedAt") ? 4_500_000 : 8);

          const counter = new Counter(fakeProvider, "fakeCounter", {
            initial: 5,
            ttl: 400,
            ttlStrategy: "TOUCH_FIRST",
          });
          await counter.inc();
          expect(fakeProvider.set).to.have.been.calledWith("global", "fakeCounter", 6);
          expect(fakeProvider.set).to.have.been.calledWith(
            "global",
            "fakeCounter::updatedAt",
            5_000_000
          );
        });

        it("does not update the last update key if it is not expired", async () => {
          const fakeProvider = mockSettingProvider();
          fakeProvider.get = (_guild, key, defVal) => (key.endsWith("::updatedAt") ? 4_500_000 : 8);

          const counter = new Counter(fakeProvider, "fakeCounter", {
            initial: 5,
            ttl: 800,
            ttlStrategy: "TOUCH_FIRST",
          });
          await counter.inc();
          expect(fakeProvider.set).to.have.been.calledWith("global", "fakeCounter", 9);
          expect(fakeProvider.set).not.to.have.been.calledWith(
            "global",
            "fakeCounter::updatedAt",
            5_000_000
          );
        });
      });
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

    describe("when TTL is set", () => {
      let clock: SinonStub;

      beforeEach(() => {
        clock = stub(Date, "now").returns(5_000_000);
      });

      afterEach(() => {
        clock.restore();
      });

      describe("using the TOUCH_ALWAYS strategy", () => {
        it("updates the last update key when incremented", async () => {
          const fakeProvider = mockSettingProvider();
          fakeProvider.get = (_guild, key, _defVal) =>
            key.endsWith("::updatedAt") ? 4_900_000 : 8;

          const counter = new Counter(fakeProvider, "fakeCounter", {
            initial: 5,
            ttl: 500,
            ttlStrategy: "TOUCH_ALWAYS",
          });
          await counter.dec();
          expect(fakeProvider.set).to.have.been.calledWith("global", "fakeCounter", 7);
          expect(fakeProvider.set).to.have.been.calledWith(
            "global",
            "fakeCounter::updatedAt",
            5_000_000
          );
        });
      });

      describe("using the TOUCH_FIRST strategy", () => {
        it("updates the last update key when it did not exist", async () => {
          const fakeProvider = mockSettingProvider();
          fakeProvider.get = (_guild, _key, defVal) => defVal;

          const counter = new Counter(fakeProvider, "fakeCounter", {
            initial: 5,
            ttl: 500,
            ttlStrategy: "TOUCH_FIRST",
          });
          await counter.dec();
          expect(fakeProvider.set).to.have.been.calledWith("global", "fakeCounter", 4);
          expect(fakeProvider.set).to.have.been.calledWith(
            "global",
            "fakeCounter::updatedAt",
            5_000_000
          );
        });

        it("updates the last update key when it was expired", async () => {
          const fakeProvider = mockSettingProvider();
          fakeProvider.get = (_guild, key, defVal) => (key.endsWith("::updatedAt") ? 4_500_000 : 8);

          const counter = new Counter(fakeProvider, "fakeCounter", {
            initial: 5,
            ttl: 400,
            ttlStrategy: "TOUCH_FIRST",
          });
          await counter.dec();
          expect(fakeProvider.set).to.have.been.calledWith("global", "fakeCounter", 4);
          expect(fakeProvider.set).to.have.been.calledWith(
            "global",
            "fakeCounter::updatedAt",
            5_000_000
          );
        });

        it("does not update the last update key if it is not expired", async () => {
          const fakeProvider = mockSettingProvider();
          fakeProvider.get = (_guild, key, defVal) => (key.endsWith("::updatedAt") ? 4_500_000 : 8);

          const counter = new Counter(fakeProvider, "fakeCounter", {
            initial: 5,
            ttl: 800,
            ttlStrategy: "TOUCH_FIRST",
          });
          await counter.dec();
          expect(fakeProvider.set).to.have.been.calledWith("global", "fakeCounter", 7);
          expect(fakeProvider.set).not.to.have.been.calledWith(
            "global",
            "fakeCounter::updatedAt",
            5_000_000
          );
        });
      });
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

    describe("when it has a TTL", () => {
      it("deletes the updated at key", async () => {
        const fakeProvider = mockSettingProvider(8);

        const counter = new Counter(fakeProvider, "fakeCounter", { ttl: 500 });
        await counter.delete();
        expect(fakeProvider.remove).to.have.been.calledWith("global", "fakeCounter");
        expect(fakeProvider.remove).to.have.been.calledWith("global", "fakeCounter::updatedAt");
      });
    });
  });
});
