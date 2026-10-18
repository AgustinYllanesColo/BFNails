import { describe, expect, it } from "vitest";
import { suggestSize, STANDARD_SIZES } from "@/lib/data/sizes";

describe("suggestSize", () => {
  it("devuelve la medida cuyas medidas de pulgar y anular están más cerca", () => {
    expect(suggestSize(STANDARD_SIZES.S.widthMm[0], STANDARD_SIZES.S.widthMm[3])).toBe("S");
    expect(suggestSize(17.5, 13)).toBe("M");
    expect(suggestSize(19, 14.5)).toBe("L");
  });
});
