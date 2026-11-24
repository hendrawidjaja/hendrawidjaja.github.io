"use client";

import Image from "next/image";
import { useState } from "react";
import { IconSize } from "@/constant";
import { ExternalLink, Images, Link as LinkIcon } from "@/src/components/Icons";
import { DialogShell } from "@/src/components/modal/DialogShell";
import type { ModalPortfolioProps } from "@/src/components/modal/interface";
import { useToast } from "@/src/components/Toast";
import { Button } from "@/src/ui/Button";
import { toRenderableHtml } from "@/src/utils/richText";

export const ModalPortfolio = ({ item, onClose, open }: ModalPortfolioProps) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const copyLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("portfolio", item.id);

    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      showToast("Link copied — open it in a new tab to jump straight here", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy the link. Copy it from the address bar instead.", "error");
    }
  };

  const header = (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
        <Images className="h-5 w-5" />
      </div>

      <div className="header">
        <h3 className="text-lg leading-tight font-bold text-slate-900 dark:text-white">
          {item.title}
        </h3>

        {item.year && (
          <span className="font-mono text-xs text-slate-400 tabular-nums dark:text-slate-500">
            {item.year}
          </span>
        )}

        {item.tagline && (
          <p className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
            {item.tagline}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <DialogShell className="max-w-3xl" header={header} onClose={onClose} open={open}>
      <div className="flex max-h-[80vh] flex-col">
        <div className="overflow-y-auto px-6 pt-6">
          {item.description && (
            <div
              className="rich-text text-sm leading-relaxed text-slate-600 dark:text-slate-300"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized server-side before storage
              dangerouslySetInnerHTML={{ __html: toRenderableHtml(item.description) }}
            />
          )}

          {item.technologies && item.technologies.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {item.technologies.map((technology) => (
                <span
                  className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  key={technology}
                >
                  {technology}
                </span>
              ))}
            </div>
          )}
        </div>

        {item.images && item.images.length > 0 && (
          <div className="mt-auto flex w-full snap-x snap-mandatory gap-3 overflow-x-auto px-6 py-4">
            {item.images.map((src, index) => (
              <a
                className="group shrink-0 snap-start overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
                href={src}
                key={src}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Image
                  alt={`${item.title} — preview ${index + 1}`}
                  className="h-40 w-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  height={40}
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                  src={src}
                  unoptimized
                  width={64}
                />
              </a>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Button
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60"
              onClick={copyLink}
            >
              <LinkIcon className={IconSize} />
              <span>{copied ? "Copied!" : "Copy link"}</span>
            </Button>

            {item.link && (
              <a
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                href={item.link}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink className={IconSize} />
                <span>View Project</span>
              </a>
            )}
          </div>

          <Button
            className="rounded-lg px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </DialogShell>
  );
};