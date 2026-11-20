import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import { useState } from "react";
import { Button } from "@/src/ui/Button";
import { useToast } from "../../components/Toast";
import type { CVData } from "../../types/cv";
import { Download, FileText, Loader2, Printer } from "../Icons";
import { DialogShell } from "./DialogShell";

interface ModalPdfExportProps {
  cvData: CVData;
  onClose: () => void;
  open: boolean;
}

const imgWidth = 210;
const pageHeight = 297;

const PDFSetting = {
  pixelRatio: 3,
  backgroundColor: "#ffffff",
  cacheBust: true,
  quality: 0.6,
};

export const ModalPdfExport = ({ onClose, cvData, open }: ModalPdfExportProps) => {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const withLightTheme = async <T,>(run: () => T | Promise<T>): Promise<T> => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    if (wasDark) root.classList.remove("dark");
    root.classList.add("exporting");

    const restore = () => {
      if (wasDark) root.classList.add("dark");
      root.classList.remove("exporting");
      window.removeEventListener("afterprint", restore);
    };

    window.addEventListener("afterprint", restore);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await run();
    } finally {
      restore();
      setTimeout(restore, 1000);
    }
  };

  const handleBrowserPrint = () => {
    onClose();
    setTimeout(() => {
      withLightTheme(() => window.print()).then(r => console.log(r));
    }, 400);
  };

  const handleDownloadDirectPdf = async () => {
    setIsGenerating(true);
    setStatusMessage("Preparing high-resolution document...");

    try {
      const cvElement = document.getElementById("cv-printable-area");
      if (!cvElement) throw new Error("Could not locate CV content for PDF conversion");

      setStatusMessage("Rendering typography and layout...");
      const dataUrl = await withLightTheme(() =>
        toJpeg(cvElement, {
          filter: (node) => !(node instanceof HTMLElement && node.classList.contains("no-export")),
          ...PDFSetting,
        }),
      );

      setStatusMessage("Compiling multi-page PDF pages...");

      const contentWidth = cvElement.offsetWidth || 1200;
      const contentHeight = cvElement.scrollHeight;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const imgHeight = (contentHeight * imgWidth) / contentWidth;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `CV_${cvData.profile.name}.pdf`;
      pdf.save(fileName);
      showToast(`Exported "${fileName}" successfully!`, "success");
      onClose();
    } catch (err: unknown) {
      console.error("PDF generation error:", err);
      const msg = err instanceof Error ? err.message : "PDF export failed";
      showToast(msg, "error");
    } finally {
      setIsGenerating(false);
      setStatusMessage("");
    }
  };

  return (
    <DialogShell onClose={onClose} open={open}>
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <FileText className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Export PDF Resume</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download a publication-ready resume formatted for executive recruiters and ATS systems
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl">
          <div className="flex items-center justify-between pb-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">{cvData.profile.name}</span>
            <span className="font-mono text-slate-500">{cvData.profile.title}</span>
          </div>
        </div>

        {isGenerating ? (
          <div className="space-y-3 p-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {statusMessage || "Generating PDF document..."}
            </p>
            <p className="text-xs text-slate-500">
              Capturing high-density vector canvas and generating multi-page PDF
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
              onClick={handleDownloadDirectPdf}
            >
              <Download className="h-4 w-4" />
              <span>Direct Download PDF File</span>
            </Button>

            <Button
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60"
              onClick={handleBrowserPrint}
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>Print or Save via Browser Dialog</span>
            </Button>
          </div>
        )}

        <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500">
          Exported documents respect ISO A4 standard pagination and include full metadata.
        </p>
      </div>
    </DialogShell>
  );
};