import { useAuth } from "../../context/AuthContext";
import type { PortfolioItem } from "../../types/cv";
import { toRenderableHtml } from "../../utils/richText";
import { BtnEditDelete } from "../BtnEditDelete";
import { Images } from "../Icons";
import { SectionShell } from "./SectionShell";

interface SectionPortfolioProps {
  items: PortfolioItem[];
  onAddItem: () => void;
  onDeleteItem: (id: string, title: string) => void;
  onEditItem: (item: PortfolioItem) => void;
  onOpenItem: (item: PortfolioItem) => void;
}

/** Thumbnails per card before collapsing the rest into a "+N" overlay. */
const MAX_THUMBNAILS = 4;

export const SectionPortfolio = ({
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onOpenItem,
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

            return (
              <article
                className="page-break-avoid group relative flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xs transition-all hover:border-slate-400 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700"
                key={item.id}
              >
                {isEditMode && (
                  // biome-ignore lint/a11y/noStaticElementInteractions: Biome Problem
                  <div
                    className="absolute top-3 right-3 z-10"
                    onClick={(event) => event.stopPropagation()}
                    role="presentation"
                  >
                    <BtnEditDelete
                      deleteTitle="Remove portfolio item"
                      editTitle="Edit portfolio item"
                      onDelete={() => onDeleteItem(item.id, item.title)}
                      onEdit={() => onEditItem(item)}
                    />
                  </div>
                )}

                {/** biome-ignore lint/a11y/useSemanticElements: Biome Problem */}
                <div
                  aria-haspopup="dialog"
                  aria-label={`Open ${item.title} details`}
                  className="flex flex-1 cursor-pointer flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  onClick={() => onOpenItem(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenItem(item);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {/* Fixed height keeps every card aligned for 1, 2, 3 or 4 images. */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {thumbnails.length === 0 ? (
                      <div className="grid h-full w-full place-items-center">
                        {/* Masked glyph takes the theme's slate, no baked-in dark square. */}
                        <span
                          aria-hidden="true"
                          className="block aspect-square w-[12%] bg-slate-400 opacity-60 dark:bg-slate-500"
                          style={{
                            maskImage: "url(/logo-glyph.svg)",
                            maskPosition: "center",
                            maskRepeat: "no-repeat",
                            maskSize: "contain",
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className={`grid h-full w-full gap-0.5 ${
                          thumbnails.length === 1 ? "grid-cols-1" : "auto-rows-fr grid-cols-2"
                        }`}
                      >
                        {thumbnails.map((src, index) => (
                          <div
                            className={`relative overflow-hidden ${
                              thumbnails.length === 3 && index === 2 ? "col-span-2" : ""
                            }`}
                            key={src}
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex w-full flex-1 flex-col p-6">
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

                    {item.tagline && (
                      <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {item.tagline}
                      </p>
                    )}

                    {item.description && (
                      // biome-ignore lint/a11y/useKeyWithClickEvents: Biome Problem
                      // biome-ignore lint/a11y/noStaticElementInteractions: Biome Problem
                      <div
                        className="rich-text mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: Biome Problem
                        dangerouslySetInnerHTML={{ __html: toRenderableHtml(item.description) }}
                        onClick={(event) => {
                          if ((event.target as HTMLElement).closest("a")) event.stopPropagation();
                        }}
                      />
                    )}

                    <div className="mt-auto pt-6">
                      {item.technologies && item.technologies.length > 0 && (
                        <div className="flex flex-wrap content-start items-start gap-1">
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