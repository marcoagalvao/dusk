import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const WIDTHS = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-[1600px]",
} as const;

export function PageContainer({
  children,
  width = "default",
  className,
}: {
  children: ReactNode;
  width?: keyof typeof WIDTHS;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 pt-5 pb-8 sm:px-6 lg:px-10 lg:pt-9 lg:pb-16", WIDTHS[width], className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  className?: string;
}

export function PageHeader({ title, description, actions, back, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="focus-ring -ml-1 mb-2 inline-flex h-8 items-center gap-1.5 rounded-[8px] px-1 text-label text-ink-muted transition-colors duration-120 hover:text-ink"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {back.label}
          </Link>
        )}
        <h1 className="text-page font-semibold tracking-tight text-balance text-ink">{title}</h1>
        {description && <p className="mt-1 text-compact text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
