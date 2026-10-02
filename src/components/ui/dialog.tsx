"use client";

import { X } from "lucide-react";
import { AlertDialog as AlertDialogPrimitive, Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

import { Button, IconButton, type ButtonVariant } from "./button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const OVERLAY =
  "fixed inset-0 z-50 bg-[#141317]/70 backdrop-blur-[2px] data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in";

/**
 * No mobile, diálogos com campos de texto ficam ancorados no topo para não
 * serem cobertos pelo teclado virtual; os demais viram bottom sheet.
 * A partir de `sm`, todos são modais centralizados.
 */
export type MobilePlacement = "top" | "bottom";

const MOBILE_PLACEMENT: Record<MobilePlacement, string> = {
  top: "inset-x-2 top-[max(0.5rem,env(safe-area-inset-top))] max-h-[calc(100dvh-1rem)] rounded-modal border data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out",
  bottom:
    "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-modal border-t pb-[calc(1rem+env(safe-area-inset-bottom))] data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out",
};

const DESKTOP =
  "sm:inset-x-auto sm:top-[12vh] sm:bottom-auto sm:left-1/2 sm:max-h-[80vh] sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:rounded-modal sm:border sm:p-6 sm:data-[state=open]:animate-dialog-in sm:data-[state=closed]:animate-dialog-out";

const WIDTHS = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-xl" } as const;

function contentClasses(placement: MobilePlacement, width: keyof typeof WIDTHS, className?: string) {
  return cn(
    "fixed z-50 flex flex-col overflow-y-auto border-line bg-surface p-4 shadow-float focus:outline-none",
    MOBILE_PLACEMENT[placement],
    DESKTOP,
    WIDTHS[width],
    className,
  );
}

interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  placement?: MobilePlacement;
  width?: keyof typeof WIDTHS;
  hideClose?: boolean;
}

export function DialogContent({
  placement = "bottom",
  width = "md",
  hideClose,
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={OVERLAY} />
      <DialogPrimitive.Content className={contentClasses(placement, width, className)} {...props}>
        {children}
        {!hideClose && (
          <DialogPrimitive.Close asChild>
            <IconButton label="Fechar" icon={<X className="size-4" />} size="sm" className="absolute top-3 right-3" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-1 pr-8">
      <DialogPrimitive.Title className="text-section font-semibold tracking-tight text-ink">{title}</DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description className="text-compact text-ink-muted">{description}</DialogPrimitive.Description>
      ) : (
        <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
      )}
    </div>
  );
}

/** No mobile o rodapé fica fixo na base do diálogo: a ação principal nunca some atrás da rolagem. */
export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-4 -mb-4 mt-6 flex items-center gap-2 border-t border-line/60 bg-surface px-4 py-3 *:flex-1",
        "sm:static sm:mx-0 sm:mb-0 sm:justify-end sm:border-t-0 sm:bg-transparent sm:p-0 sm:*:flex-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirmação (AlertDialog)
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void;
  children?: ReactNode;
  confirmDisabled?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = "danger",
  onConfirm,
  children,
  confirmDisabled,
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className={OVERLAY} />
        <AlertDialogPrimitive.Content className={contentClasses("bottom", "sm")}>
          <AlertDialogPrimitive.Title className="text-emph font-semibold text-ink">{title}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description asChild>
            <div className={cn("text-compact text-ink-muted", description ? "mt-1.5" : "sr-only")}>
              {description ?? title}
            </div>
          </AlertDialogPrimitive.Description>
          {children}
          <div className="mt-6 flex items-center gap-2 *:flex-1 sm:justify-end sm:*:flex-none">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="ghost">Cancelar</Button>
            </AlertDialogPrimitive.Cancel>
            <Button
              variant={confirmVariant}
              disabled={confirmDisabled}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
