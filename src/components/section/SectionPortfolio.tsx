import { useAuth } from "../../context/AuthContext";
import type { PortfolioItem } from "../../types/cv";
import { toRenderableHtml } from "../../utils/richText";
import { BtnEditDelete } from "../BtnEditDelete";
import { ExternalLink, Images } from "../Icons";
import { SectionShell } from "./SectionShell";

interface SectionPortfolioProps {
  items: PortfolioItem[];
  onAddItem: () => void;
  onDeleteItem: (id: string, title: string) => void;
  onEditItem: (item: PortfolioItem) => void;
}

/** Thumbnails per card before collapsing the rest into a "+N" overlay. */
const MAX_THUMBNAILS = 4;

export const SectionPortfolio = ({
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: SectionPortfolioProps) => {
  const { isEditMode } = useAuth();

  return (
    <SectionShell
      addLabel="Add Portfolio"
      id="portfolio"
      isEditMode={isEditMode}
      onAdd={onAddItem}
      subtitle="Visual case studies, product interfaces, and visuals"
      title="Portfolio & Details"
    >
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          No portfolio pieces yet.{" "}
          {isEditMode && 'Click "Add Portfolio" to showcase screenshots and visuals.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {items.map((item) => {
            const images = item.images ?? [];
            const thumbnails = images.slice(0, MAX_THUMBNAILS);
            const hiddenCount = images.length - thumbnails.length;

            return (
              <article
                className="page-break-avoid flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xs transition-all hover:border-slate-400 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700"
                key={item.id}
              >
                {thumbnails.length > 0 && (
                  <div
                    className={`grid gap-0.5 bg-slate-100 dark:bg-slate-800 ${
                      thumbnails.length === 1 ? "grid-cols-1" : "grid-cols-2"
                    }`}
                  >
                    {thumbnails.map((src, index) => (
                      <a
                        className="group relative block aspect-video overflow-hidden"
                        href={src}
                        key={src}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {/* biome-ignore lint/performance/noImgElement: portfolio images are arbitrary admin-supplied URLs */}
                        <img
                          alt={`${item.title} — preview ${index + 1}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.visibility = "hidden";
                          }}
                          src={src}
                        />
                        {hiddenCount > 0 && index === thumbnails.length - 1 && (
                          <span className="absolute inset-0 grid place-items-center bg-slate-950/60 text-lg font-bold text-white">
                            +{hiddenCount}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                        <Images className="h-4 w-4" />
                      </div>

                      <div>
                        <h3 className="text-base leading-tight font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>
                        {item.year && (
                          <span className="font-mono text-xs text-slate-400 tabular-nums dark:text-slate-500">
                            {item.year}
                          </span>
                        )}
                      </div>
                    </div>

                    {isEditMode && (
                      <BtnEditDelete
                        deleteTitle="Remove portfolio item"
                        editTitle="Edit portfolio item"
                        onDelete={() => onDeleteItem(item.id, item.title)}
                        onEdit={() => onEditItem(item)}
                      />
                    )}
                  </div>

                  {item.tagline && (
                    <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {item.tagline}
                    </p>
                  )}

                  {item.description && (
                    <div
                      className="rich-text mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized server-side before storage
                      dangerouslySetInnerHTML={{ __html: toRenderableHtml(item.description) }}
                    />
                  )}

                  <div className="mt-auto pt-6">
                    {item.technologies && item.technologies.length > 0 && (
                      <div className="mb-4 flex flex-wrap content-start items-start gap-1">
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

                    {item.link && (
                      <a
                        className="no-export no-print inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        href={item.link}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>View Project</span>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
};