/** Conversões de cor. HSV é o modelo da tela de escolha: matiz em graus, saturação e brilho de 0 a 100. */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsv {
  h: number;
  s: number;
  v: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Aceita `#rgb` ou `#rrggbb`, com ou sem `#`, e devolve `#rrggbb` minúsculo. */
export function normalizeHex(value: string): string | null {
  const digits = value.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{6}$/.test(digits)) return `#${digits}`;
  if (/^[0-9a-f]{3}$/.test(digits)) return `#${[...digits].map((digit) => digit + digit).join("")}`;
  return null;
}

export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const channel = (value: number) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);

  let h = 0;
  if (delta > 0) {
    if (max === r) h = ((g - b) / delta + 6) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }

  return { h: h * 60, s: max === 0 ? 0 : (delta / max) * 100, v: (max / 255) * 100 };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const channel = (offset: number) => {
    const k = (offset + h / 60) % 6;
    const value = (v / 100) * (1 - (s / 100) * Math.max(0, Math.min(k, 4 - k, 1)));
    return Math.round(value * 255);
  };
  return { r: channel(5), g: channel(3), b: channel(1) };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [red, green, blue] = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** Contraste WCAG entre duas cores, de 1 a 21. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
