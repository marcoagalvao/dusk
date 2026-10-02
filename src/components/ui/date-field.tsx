"use client";

import { addDaysToKey, nextWeekdayKey } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";

import { Input } from "./form-controls";

interface DateFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  today: string;
  inputRef?: React.Ref<HTMLInputElement>;
  /** Atalhos voltados a follow-up ("revisar na segunda") ou a prazo. */
  shortcuts?: "review" | "due";
  autoFocus?: boolean;
}

function shortcutsFor(kind: "review" | "due", today: string) {
  const common = [
    { label: "Amanhã", value: addDaysToKey(today, 1) },
    { label: "Segunda", value: nextWeekdayKey(today, 1) },
    { label: "Em 1 semana", value: addDaysToKey(today, 7) },
  ];
  return kind === "due"
    ? [{ label: "Hoje", value: today }, ...common]
    : [{ label: "Em 2 dias", value: addDaysToKey(today, 2) }, ...common];
}

/** Date picker nativo (bom no mobile) com atalhos de um toque. */
export function DateField({ id, value, onChange, today, inputRef, shortcuts = "due", autoFocus }: DateFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input ref={inputRef} id={id} type="date" autoFocus={autoFocus} value={value} onChange={(event) => onChange(event.target.value)} className="flex-1" />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="focus-ring h-10 shrink-0 rounded-control px-2.5 text-label text-ink-subtle transition-colors duration-120 hover:bg-raised hover:text-ink"
          >
            Limpar
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {shortcutsFor(shortcuts, today).map((shortcut) => (
          <button
            key={shortcut.label}
            type="button"
            aria-pressed={value === shortcut.value}
            onClick={() => onChange(shortcut.value)}
            className={cn(
              "focus-ring h-7 rounded-full border px-2.5 text-meta transition-colors duration-120",
              value === shortcut.value
                ? "border-primary/60 bg-primary/12 text-ink"
                : "border-line text-ink-muted hover:border-ink-subtle hover:text-ink",
            )}
          >
            {shortcut.label}
          </button>
        ))}
      </div>
    </div>
  );
}
