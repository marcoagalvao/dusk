import type { ReactNode } from "react";

export function SettingsSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col">
      <h2 id={id} className="mb-2 text-section font-semibold text-ink">
        {title}
      </h2>
      <div className="flex flex-col divide-y divide-line/60 border-y border-line/60">{children}</div>
    </section>
  );
}

export function SettingsRow({
  title,
  description,
  action,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className="text-compact font-medium text-ink">{title}</div>
        {description && <p className="mt-0.5 max-w-prose text-label text-ink-muted">{description}</p>}
        {children}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
