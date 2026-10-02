import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "focus-ring inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-[background-color,color,border-color,transform] duration-120 active:translate-y-px disabled:pointer-events-none disabled:opacity-45";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-line bg-surface text-ink hover:border-ink-subtle/60 hover:bg-raised",
  ghost: "text-ink-muted hover:bg-raised hover:text-ink",
  danger:
    "border border-status-blocked/35 bg-status-blocked/12 text-status-blocked hover:border-status-blocked/60 hover:bg-status-blocked/20",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-label",
  md: "h-10 px-4 text-compact",
  lg: "h-11 px-5 text-body",
};

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-11",
};

export function buttonClasses({
  variant = "secondary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}

type IconButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> & {
  /** Rótulo acessível obrigatório para botões só com ícone (PRD §61). */
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function IconButton({ label, icon, variant = "ghost", size = "md", className, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(BASE, VARIANTS[variant], ICON_SIZES[size], "px-0", className)}
      {...props}
    >
      {icon}
    </button>
  );
}
