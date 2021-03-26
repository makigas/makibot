import { expect } from "chai";
import "mocha";

import { getLevel } from "../../src/lib/karma";

describe("karma", () => {
  describe("#getLevel", () => {
    it("works for positives", () => {
      expect(getLevel(1)).to.eq(1);
      expect(getLevel(49)).to.eq(1);
      expect(getLevel(50)).to.eq(2);
    });

    it("works for negatives", () => {
      expect(getLevel(-1)).to.eq(-1);
      expect(getLevel(-49)).to.eq(-1);
      expect(getLevel(-50)).to.eq(-2);
    });

    it("works for zero", () => {
      expect(getLevel(0)).to.eq(0);
    });
  });
});
