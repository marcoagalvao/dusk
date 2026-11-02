import { describe, expect, it } from "vitest";

import { contrastRatio, hexToRgb, hsvToRgb, normalizeHex, rgbToHex, rgbToHsv } from "./color";

describe("normalizeHex", () => {
  it("aceita com ou sem #, curto ou longo, e devolve minúsculo", () => {
    expect(normalizeHex("#FF0000")).toBe("#ff0000");
    expect(normalizeHex("ff0000")).toBe("#ff0000");
    expect(normalizeHex(" #AbC ")).toBe("#aabbcc");
  });

  it("recusa o que não é cor", () => {
    expect(normalizeHex("")).toBeNull();
    expect(normalizeHex("#ff00")).toBeNull();
    expect(normalizeHex("vermelho")).toBeNull();
  });
});

describe("conversões", () => {
  it("hex e RGB são inversos", () => {
    expect(hexToRgb("#ff8000")).toEqual({ r: 255, g: 128, b: 0 });
    expect(rgbToHex({ r: 255, g: 128, b: 0 })).toBe("#ff8000");
  });

  it("limita valores fora de 0 a 255", () => {
    expect(rgbToHex({ r: 300, g: -5, b: 12.4 })).toBe("#ff000c");
  });

  it("converte as cores puras para HSV", () => {
    expect(rgbToHsv({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, v: 100 });
    expect(rgbToHsv({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, v: 100 });
    expect(rgbToHsv({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, v: 100 });
    expect(rgbToHsv({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, v: 0 });
  });

  it("volta de HSV para RGB", () => {
    expect(hsvToRgb({ h: 0, s: 100, v: 100 })).toEqual({ r: 255, g: 0, b: 0 });
    expect(hsvToRgb({ h: 360, s: 100, v: 100 })).toEqual({ r: 255, g: 0, b: 0 });
    expect(hsvToRgb({ h: 200, s: 0, v: 50 })).toEqual({ r: 128, g: 128, b: 128 });
  });

  it("ida e volta preserva qualquer cor", () => {
    for (const hex of ["#c4b5fd", "#a9c5eb", "#123456", "#fefefe", "#010203"]) {
      expect(rgbToHex(hsvToRgb(rgbToHsv(hexToRgb(hex))))).toBe(hex);
    }
  });
});

describe("contrastRatio", () => {
  it("vai de 1 (iguais) a 21 (preto e branco), em qualquer ordem", () => {
    expect(contrastRatio("#123456", "#123456")).toBe(1);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21);
  });
});
