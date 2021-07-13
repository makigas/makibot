import { expect } from "chai";
import "mocha";

import { getLevelV2 } from "../../src/lib/karma";

describe("karma", () => {
  describe("#getLevelV2", () => {
    it("works for positives", () => {
      expect(getLevelV2(1)).to.eq(1);
      expect(getLevelV2(29)).to.eq(1);
      expect(getLevelV2(30)).to.eq(2);
      expect(getLevelV2(50)).to.eq(2);
      expect(getLevelV2(61)).to.eq(3);
      expect(getLevelV2(3879)).to.eq(49);
      expect(getLevelV2(3890)).to.eq(50);
    });

    it("works for negatives", () => {
      expect(getLevelV2(-1)).to.eq(-1);
      expect(getLevelV2(-29)).to.eq(-1);
      expect(getLevelV2(-30)).to.eq(-2);
    });

    it("works for zero", () => {
      expect(getLevelV2(0)).to.eq(0);
    });
  });
});
