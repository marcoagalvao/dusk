import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/*
 * Campos com 16px no mobile para o iOS não aplicar zoom ao focar,
 * e 14px a partir de `sm`.
 */
const CONTROL =
  "w-full rounded-control border border-line bg-surface text-emph text-ink transition-[border-color,box-shadow] duration-120 hover:border-ink-subtle/70 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20 disabled:opacity-50 sm:text-compact";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, "h-10 px-3", className)} {...props} />;
}

export function Textarea({ className, rows = 2, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} className={cn(CONTROL, "min-h-10 resize-y px-3 py-2", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(CONTROL, "h-10 cursor-pointer appearance-none pr-9 pl-3", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-subtle"
      />
    </div>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Destaque discreto para campos incentivados (ex.: Aguardando). */
  emphasized?: boolean;
}

export function Field({ label, htmlFor, hint, children, className, emphasized }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className={cn("text-label font-medium", emphasized ? "text-status-waiting" : "text-ink-muted")}
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-meta text-ink-subtle">{hint}</p>}
    </div>
  );
}
