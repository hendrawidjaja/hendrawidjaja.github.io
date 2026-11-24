import type { ComponentPropsWithoutRef } from "react";
import { IconSize } from "@/constant";
import { Edit, Trash2 } from "@/src/components/Icons";
import { Button } from "@/src/ui/Button";

interface BtnEditDeleteProps extends ComponentPropsWithoutRef<"button"> {
  deleteTitle?: string;
  editTitle?: string;
  onDelete: () => void;
  onEdit: () => void;
}

const BtnSharedClass =
  "rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800";

export const BtnEditDelete = ({
  deleteTitle = "Delete entry",
  editTitle = "Edit entry",
  onDelete,
  onEdit,
}: BtnEditDeleteProps) => (
  <div className="flex items-end gap-2">
    <Button
      className={`${BtnSharedClass} hover:text-blue-600 dark:hover:text-blue-400`}
      onClick={onEdit}
      title={editTitle}
    >
      <Edit className={IconSize} />
    </Button>

    <Button
      className={`${BtnSharedClass} hover:text-rose-600 dark:hover:text-rose-400`}
      onClick={onDelete}
      title={deleteTitle}
    >
      <Trash2 className={IconSize} />
    </Button>
  </div>
);