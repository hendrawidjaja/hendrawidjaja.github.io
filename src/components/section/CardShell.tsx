import type { PropsWithChildren } from "react";

interface CardShellProps extends PropsWithChildren {
  className?: string;
}

export const CardShell = ({ className, children }: CardShellProps) => (
  <div
    className={`rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700 ${className ?? ""}`}
  >
    {children}
  </div>
);