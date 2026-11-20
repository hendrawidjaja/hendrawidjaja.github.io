import { Button } from "@/src/ui/Button";
import { AlertTriangle } from "../Icons";
import { DialogShell } from "./DialogShell";

interface ModalDeleteConfirmProps {
  isDeleting: boolean;
  itemName: string;
  itemType: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
}

export const ModalDeleteConfirm = ({
  isDeleting,
  itemName,
  itemType,
  onCancel,
  onConfirm,
  open,
}: ModalDeleteConfirmProps) => (
  <DialogShell className="max-w-sm" onClose={onCancel} open={open}>
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-full bg-rose-50 p-2.5 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete {itemType}?</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This action will permanently remove this entry.
          </p>
        </div>
      </div>

      <p className="mb-6 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-slate-900 dark:text-white">"{itemName}"</span>?
      </p>

      <div className="flex items-center justify-end gap-3">
        <Button
          className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          disabled={isDeleting}
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-50"
          disabled={isDeleting}
          onClick={onConfirm}
        >
          {isDeleting ? "Deleting..." : "Delete Entry"}
        </Button>
      </div>
    </div>
  </DialogShell>
);
