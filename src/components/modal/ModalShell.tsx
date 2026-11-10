import { Button } from "../ui/Button";
import React, { useEffect, useRef, PropsWithChildren, ReactNode } from "react";
import { useKeyPress } from "../../hooks/use-keypress";
import { useFocusTrap } from "../../hooks/use-focus-trap";
import { X } from "../Icons";

interface ModalShellProps extends PropsWithChildren {
  headerChildren?: ReactNode;
  innerClassName?: string;
  isOpen: boolean;
  maxW?: "sm" | "md" | "lg" | "2xl";
  onClose: () => void;
}

const maxWMap: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  "2xl": "max-w-2xl",
};
export const ModalShell = ({
  isOpen,
  onClose,
  maxW = "lg",
  innerClassName,
  headerChildren,
  children,
}: ModalShellProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, isOpen, onClose);
  useKeyPress("Escape", onClose, { enabled: isOpen });

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
    >
      <div
        className={`animate-in fade-in zoom-in-95 relative w-full ${maxWMap[maxW] ?? maxWMap.lg} rounded-2xl border border-slate-200 bg-white shadow-2xl duration-150 dark:border-slate-800 dark:bg-slate-900 ${innerClassName ?? ""}`}
      >
        {headerChildren ? (
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            {headerChildren}
            <Button
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Button
            className="absolute top-4 right-4 rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {children}
      </div>
    </div>
  );
};