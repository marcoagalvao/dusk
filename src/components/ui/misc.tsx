import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-current/25 px-1 font-mono text-[11px] leading-none",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function ProgressBar({ percent, className, color }: { percent: number; className?: string; color?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn("h-1 overflow-hidden rounded-full bg-line/60", className)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-220"
        style={{ width: `${percent}%`, backgroundColor: color ?? "var(--color-status-completed)" }}
      />
    </div>
  );
}

interface SectionHeadingProps {
  title: string;
  count?: number;
  action?: ReactNode;
  id?: string;
  className?: string;
}

export function SectionHeading({ title, count, action, id, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-2 flex min-h-8 items-center justify-between gap-3", className)}>
      <h2 id={id} className="flex items-baseline gap-2 text-compact font-semibold text-ink-muted">
        {title}
        {count !== undefined && count > 0 && <span className="text-meta font-normal text-ink-subtle">{count}</span>}
      </h2>
      {action}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, className, icon }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-start gap-1 rounded-card border border-dashed border-line/80 px-4 py-4", className)}>
      {icon && <div className="mb-1 text-ink-subtle">{icon}</div>}
      <p className="text-compact font-medium text-ink">{title}</p>
      {description && <p className="text-compact text-ink-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (value: T) => void;
  label: string;
}

export function SegmentedControl<T extends string>({ value, options, onChange, label }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-10 items-center rounded-control border border-line bg-surface p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "focus-ring inline-flex h-full items-center gap-1.5 rounded-[8px] px-3 text-label font-medium transition-colors duration-120",
              active ? "bg-raised text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
