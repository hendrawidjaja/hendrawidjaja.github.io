"use client";

import { type ComponentPropsWithoutRef, type ReactNode, useEffect, useRef } from "react";
import { Button } from "@/src/ui/Button";
import { X } from "../Icons";

export interface DialogShellProps extends ComponentPropsWithoutRef<"dialog"> {
  header?: ReactNode;
  onClose: () => void;
  open: boolean;
}

export const DialogShell = ({
  children,
  className,
  header,
  onClose,
  open,
  ...rest
}: DialogShellProps) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const handler = () => onClose();
    d.addEventListener("close", handler);
    return () => d.removeEventListener("close", handler);
  }, [onClose]);

  return (
    <dialog
      className={`w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 ${className || "max-w-lg"}`}
      ref={ref}
      {...rest}
    >
      {header ? (
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          {header}
          <Button
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <Button
          aria-label="Close"
          className="absolute top-4 right-4 z-10 rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {children}
    </dialog>
  );
};