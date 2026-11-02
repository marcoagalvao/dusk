"use client";

import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";

import { contrastRatio, hexToRgb, hsvToRgb, normalizeHex, rgbToHex, rgbToHsv, type Hsv, type Rgb } from "@/lib/utils/color";

import { Field, Input } from "./form-controls";
import { surfaceHex } from "./tokens";

/** Mesma ordem do seletor clássico: vermelho no topo e na base. */
const HUE_GRADIENT = "linear-gradient(to bottom, #f00, #f0f, #00f, #0ff, #0f0, #ff0, #f00)";
const THUMB = "pointer-events-none absolute border-2 border-ink shadow-[0_0_0_1px_var(--color-canvas)]";
/** Abaixo disso a cor quase some no fundo escuro do app. */
const MIN_VISIBLE_CONTRAST = 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toHex = (hsv: Hsv) => rgbToHex(hsvToRgb(hsv));

/** Arraste por mouse ou toque, entregando a posição de 0 a 1 dentro do elemento. */
function dragHandlers(onMove: (x: number, y: number) => void) {
  const apply = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onMove(clamp((event.clientX - rect.left) / rect.width, 0, 1), clamp((event.clientY - rect.top) / rect.height, 0, 1));
  };
  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      apply(event);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) apply(event);
    },
  };
}

/** Passo das setas: 1, ou 10 com Shift. Devolve null para outras teclas. */
function arrowDelta(event: KeyboardEvent): { x: number; y: number } | null {
  const step = event.shiftKey ? 10 : 1;
  switch (event.key) {
    case "ArrowLeft":
      return { x: -step, y: 0 };
    case "ArrowRight":
      return { x: step, y: 0 };
    case "ArrowUp":
      return { x: 0, y: step };
    case "ArrowDown":
      return { x: 0, y: -step };
    default:
      return null;
  }
}

/** Campo que aceita digitação incompleta e só aplica o valor quando ele é válido. */
function ColorField<T>({
  label,
  value,
  parse,
  onValid,
  numeric,
}: {
  label: string;
  value: string;
  parse: (text: string) => T | null;
  onValid: (parsed: T) => void;
  numeric?: boolean;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        value={draft ?? value}
        inputMode={numeric ? "numeric" : "text"}
        maxLength={numeric ? 3 : 7}
        autoComplete="off"
        spellCheck={false}
        className="px-2.5 tabular-nums"
        onChange={(event) => {
          setDraft(event.target.value);
          const parsed = parse(event.target.value);
          if (parsed !== null) onValid(parsed);
        }}
        onBlur={() => setDraft(null)}
      />
    </Field>
  );
}

function parseChannel(text: string): number | null {
  if (!/^\d{1,3}$/.test(text)) return null;
  const value = Number(text);
  return value <= 255 ? value : null;
}

/**
 * Escolha livre de cor: quadrado de saturação e brilho, faixa de matiz, hex e RGB.
 * Monte junto com a abertura: o valor recebido nesse momento vira a cor "Atual".
 */
export function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [original] = useState(value);
  const [surface] = useState(surfaceHex);
  // O estado é HSV porque em cinza ou preto o hex perde o matiz, e a faixa pularia ao arrastar.
  const [hsv, setHsv] = useState<Hsv>(() => rgbToHsv(hexToRgb(value)));

  const hex = toHex(hsv);
  const rgb = hsvToRgb(hsv);
  const tooDark = contrastRatio(hex, surface) < MIN_VISIBLE_CONTRAST;

  const update = (next: Hsv) => {
    setHsv(next);
    onChange(toHex(next));
  };

  const updateFromRgb = (next: Rgb) => {
    const converted = rgbToHsv(next);
    update({
      h: converted.s === 0 || converted.v === 0 ? hsv.h : converted.h,
      s: converted.v === 0 ? hsv.s : converted.s,
      v: converted.v,
    });
  };

  const handleSquareKey = (event: KeyboardEvent) => {
    const delta = arrowDelta(event);
    if (!delta) return;
    event.preventDefault();
    update({ ...hsv, s: clamp(hsv.s + delta.x, 0, 100), v: clamp(hsv.v + delta.y, 0, 100) });
  };

  const handleHueKey = (event: KeyboardEvent) => {
    const delta = arrowDelta(event);
    if (!delta) return;
    event.preventDefault();
    update({ ...hsv, h: clamp(hsv.h + delta.x + delta.y, 0, 360) });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2.5">
        <div
          role="slider"
          tabIndex={0}
          aria-label="Saturação e brilho"
          aria-valuenow={Math.round(hsv.s)}
          aria-valuetext={`Saturação ${Math.round(hsv.s)}%, brilho ${Math.round(hsv.v)}%`}
          className="focus-ring relative h-40 min-w-0 flex-1 cursor-crosshair touch-none rounded-[8px]"
          style={{
            backgroundColor: `hsl(${hsv.h} 100% 50%)`,
            backgroundImage: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
          }}
          onKeyDown={handleSquareKey}
          {...dragHandlers((x, y) => update({ ...hsv, s: x * 100, v: (1 - y) * 100 }))}
        >
          <span
            aria-hidden="true"
            className={`${THUMB} size-4 -translate-x-1/2 -translate-y-1/2 rounded-full`}
            style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: hex }}
          />
        </div>

        <div
          role="slider"
          tabIndex={0}
          aria-label="Matiz"
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(hsv.h)}
          className="focus-ring relative h-40 w-6 shrink-0 cursor-ns-resize touch-none rounded-[8px]"
          style={{ backgroundImage: HUE_GRADIENT }}
          onKeyDown={handleHueKey}
          {...dragHandlers((_, y) => update({ ...hsv, h: (1 - y) * 360 }))}
        >
          <span
            aria-hidden="true"
            className={`${THUMB} inset-x-[-2px] h-2 -translate-y-1/2 rounded-[3px]`}
            style={{ top: `${100 - hsv.h / 3.6}%` }}
          />
        </div>
      </div>

      <div className="flex items-end gap-2.5">
        <div className="min-w-0 flex-1">
          <ColorField label="Hex" value={hex} parse={normalizeHex} onValid={(next) => updateFromRgb(hexToRgb(next))} />
        </div>
        <div className="flex shrink-0 gap-1">
          <span className="flex flex-col items-center gap-1.5 text-meta text-ink-muted">
            Nova
            <span aria-hidden="true" className="size-10 rounded-l-control" style={{ backgroundColor: hex }} />
          </span>
          <span className="flex flex-col items-center gap-1.5 text-meta text-ink-muted">
            Atual
            <button
              type="button"
              aria-label={`Voltar para a cor atual, ${original}`}
              title="Voltar para esta cor"
              onClick={() => updateFromRgb(hexToRgb(original))}
              className="focus-ring size-10 cursor-pointer rounded-r-control"
              style={{ backgroundColor: original }}
            />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ColorField numeric label="R" value={`${rgb.r}`} parse={parseChannel} onValid={(r) => updateFromRgb({ ...rgb, r })} />
        <ColorField numeric label="G" value={`${rgb.g}`} parse={parseChannel} onValid={(g) => updateFromRgb({ ...rgb, g })} />
        <ColorField numeric label="B" value={`${rgb.b}`} parse={parseChannel} onValid={(b) => updateFromRgb({ ...rgb, b })} />
      </div>

      {tooDark && <p className="text-meta text-ink-muted">Cor muito escura: vai aparecer pouco no fundo do app.</p>}
    </div>
  );
}
