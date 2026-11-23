import { FileText, Printer } from "@/src/components/Icons";
import type { ModalPdfExportProps } from "@/src/components/modal/interface";
import { Button } from "@/src/ui/Button";
import { DialogShell } from "./DialogShell";

/**
 * Exporting goes through the browser's print dialog ("Save as PDF") instead of
 * rasterising the page with html-to-image: the old route sliced one tall JPEG
 * at arbitrary A4 offsets, so cards were cut in half and the `<picture>` avatar
 * never got inlined. Print keeps real text/links and honours the
 * `page-break-avoid` rules in globals.css.
 */
export const ModalPdfExport = ({ onClose, cvData, open }: ModalPdfExportProps) => {
  const handleSaveAsPdf = () => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    // The printed page is always light, whatever the on-screen theme.
    if (wasDark) root.classList.remove("dark");

    onClose();
    setTimeout(() => window.print(), 400);

    const restore = () => {
      if (wasDark) root.classList.add("dark");
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
  };

  const header = (
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
        <FileText className="h-6 w-6" />
      </div>

      <div className="header">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Export PDF Resume</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pick "Save as PDF" in the print dialog
        </p>
      </div>
    </div>
  );

  return (
    <DialogShell header={header} onClose={onClose} open={open}>
      <div className="p-6">
        <div className="mb-6 rounded-xl">
          <div className="flex items-center justify-between pb-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">
              {cvData.profile.name}
            </span>
            <span className="font-mono text-slate-500">{cvData.profile.title}</span>
          </div>
        </div>

        <Button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
          onClick={handleSaveAsPdf}
        >
          <Printer className="h-4 w-4" />
          <span>Save as PDF</span>
        </Button>

        <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500">
          A4 pages, selectable text, no section cut in half. Choose "Save as PDF" as the printer
          destination.
        </p>
      </div>
    </DialogShell>
  );
};
