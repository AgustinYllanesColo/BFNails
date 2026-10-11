import { describe, expect, it } from "vitest";
import { cn, formatARS, formatARSParts, slugify } from "@/lib/format";

describe("cn (tailwind-merge con la escala propia)", () => {
  it("un tamaño de la escala no borra al color", () => {
    expect(cn("text-h2", "text-bordo")).toBe("text-h2 text-bordo");
    expect(cn("text-meta text-ink-soft")).toBe("text-meta text-ink-soft");
    expect(cn("text-price", "text-on-bordo-muted")).toBe("text-price text-on-bordo-muted");
  });

  it("dos tamaños de la escala: gana el último", () => {
    expect(cn("text-h2", "text-h1")).toBe("text-h1");
    expect(cn("text-sm", "text-label")).toBe("text-label");
  });

  it("resuelve conflictos con prefijos responsivos", () => {
    expect(cn("py-20 md:py-28", "py-0 md:py-0")).toBe("py-0 md:py-0");
  });

  it("radios y sombras propios se reemplazan entre sí", () => {
    expect(cn("rounded-lg", "rounded-pill")).toBe("rounded-pill");
    expect(cn("shadow-md", "shadow-sticker")).toBe("shadow-sticker");
    expect(cn("shadow-bar-inverse", "shadow-none")).toBe("shadow-none");
  });

  it("acepta condicionales, arrays y objetos (clsx)", () => {
    const off = false as boolean;
    expect(cn("a", off && "b", null, undefined, ["c", { d: true, e: false }])).toBe("a c d");
  });
});

describe("formatARSParts", () => {
  it("separa el signo del número", () => {
    expect(formatARSParts(22000)).toEqual({ sign: "$", number: "22.000" });
    expect(formatARSParts(22000).number).toBe("22.000");
  });

  it("redondea como formatARS y no deja espacios", () => {
    expect(formatARSParts(1999.6).number).toBe("2.000");
    expect(formatARSParts(1234567)).toEqual({ sign: "$", number: "1.234.567" });
    expect(formatARSParts(0).number).toBe("0");
  });

  it("los negativos llevan el menos en el signo", () => {
    expect(formatARSParts(-1500)).toEqual({ sign: "-$", number: "1.500" });
  });

  it("es coherente con formatARS", () => {
    const { sign, number } = formatARSParts(18500);
    expect(formatARS(18500).replace(/\s/g, "")).toBe(`${sign}${number}`);
  });
});

describe("slugify", () => {
  it("saca tildes y símbolos", () => {
    expect(slugify("Diseñá tu set: Leopardo ✦")).toBe("disena-tu-set-leopardo");
  });
});
