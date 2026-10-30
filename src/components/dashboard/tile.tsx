import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/*
 * Regra de leitura do painel: todo bloco tem um título em linguagem comum, que
 * diz do que se trata, e no máximo uma frase explicando como ler o que vem abaixo.
 */

export function TileHeading({
  id,
  title,
  hint,
  count,
  action,
  level = "h2",
  className,
}: {
  id?: string;
  title: ReactNode;
  hint?: string;
  count?: number;
  action?: ReactNode;
  level?: "h2" | "h3";
  className?: string;
}) {
  const Heading = level;
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <Heading id={id} className="flex items-baseline gap-2 text-emph font-semibold text-ink">
          {title}
          {count !== undefined && count > 0 && <span className="text-label font-normal text-ink-muted tabular-nums">{count}</span>}
        </Heading>
        {hint && <p className="mt-0.5 text-label text-pretty text-ink-muted">{hint}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Tile({ children, className, labelledBy }: { children: ReactNode; className?: string; labelledBy?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={cn("min-w-0 rounded-card border border-line/50 bg-surface/70 p-5", className)}>
      {children}
    </section>
  );
}
