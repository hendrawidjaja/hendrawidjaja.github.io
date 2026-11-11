import { Edit, Trash2 } from "./Icons";
import { Button } from "./ui/Button";

interface BtnEditDeleteProps {
  deleteTitle?: string;
  editTitle?: string;
  onDelete: () => void;
  onEdit: () => void;
}

export const BtnEditDelete = ({
  deleteTitle = "Delete entry",
  editTitle = "Edit entry",
  onDelete,
  onEdit,
}: BtnEditDeleteProps) => (
  <div className="flex items-end gap-2">
    <Button
      className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
      onClick={onEdit}
      title={editTitle}
    >
      <Edit className="h-3.5 w-3.5" />
    </Button>

    <Button
      className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-rose-400"
      onClick={onDelete}
      title={deleteTitle}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  </div>
);