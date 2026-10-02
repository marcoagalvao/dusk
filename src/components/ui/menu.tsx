"use client";

import { Check } from "lucide-react";
import { DropdownMenu as Menu, Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const FLOATING =
  "z-50 min-w-48 rounded-menu border border-line bg-raised p-1 shadow-float focus:outline-none data-[state=open]:animate-pop-in";

const ITEM =
  "flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 text-compact text-ink outline-none transition-colors duration-120 data-[disabled]:pointer-events-none data-[highlighted]:bg-line/50 data-[disabled]:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ink-muted";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuRadioGroup = Menu.RadioGroup;

export function DropdownMenuContent({ className, align = "end", sideOffset = 6, ...props }: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content align={align} sideOffset={sideOffset} collisionPadding={12} className={cn(FLOATING, className)} {...props} />
    </Menu.Portal>
  );
}

export function DropdownMenuItem({
  className,
  tone = "default",
  ...props
}: ComponentProps<typeof Menu.Item> & { tone?: "default" | "danger" }) {
  return (
    <Menu.Item
      className={cn(ITEM, tone === "danger" && "text-status-blocked [&_svg]:text-status-blocked", className)}
      {...props}
    />
  );
}

export function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem className={cn(ITEM, "relative pr-8", className)} {...props}>
      {children}
      <Menu.ItemIndicator className="absolute right-2.5">
        <Check className="text-primary!" />
      </Menu.ItemIndicator>
    </Menu.RadioItem>
  );
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <Menu.Label className="px-2.5 pt-1.5 pb-1 text-meta font-medium text-ink-subtle">{children}</Menu.Label>;
}

export function DropdownMenuSeparator() {
  return <Menu.Separator className="mx-1 my-1 h-px bg-line/70" />;
}

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverClose = PopoverPrimitive.Close;

export function PopoverContent({ className, align = "start", sideOffset = 6, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(FLOATING, "p-3", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
