import { describe, expect, it } from "vitest";
import { suggestSize, STANDARD_SIZES } from "@/lib/data/sizes";

describe("suggestSize", () => {
  it("devuelve el talle cuyas medidas de pulgar y anular están más cerca", () => {
    expect(suggestSize(STANDARD_SIZES.XS.widthMm[0], STANDARD_SIZES.XS.widthMm[3])).toBe("XS");
    expect(suggestSize(17.5, 13)).toBe("M");
    expect(suggestSize(19, 14.5)).toBe("L");
  });
});
