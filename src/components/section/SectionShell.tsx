import type { PropsWithChildren } from "react";
import { Plus } from "@/src/components/Icons";
import { Button } from "@/src/ui/Button";

interface SectionShellProps {
  addLabel: string;
  id: string;
  isEditMode: boolean;
  onAdd: () => void;
  subtitle: string;
  title: string;
}

export const SectionShell = ({
  id,
  title,
  subtitle,
  isEditMode,
  addLabel,
  onAdd,
  children,
}: SectionShellProps & PropsWithChildren) => (
  <section className="border-b border-slate-300 py-12 sm:py-16 dark:border-slate-800" id={id}>
    <div className="mx-auto max-w-6xl px-4 lg:px-8">
      <div className="mb-8 flex break-after-avoid items-center justify-between gap-4 print:mb-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>

        {isEditMode && (
          <Button
            className="no-print flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            onClick={onAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{addLabel}</span>
          </Button>
        )}
      </div>
      {children}
    </div>
  </section>
);