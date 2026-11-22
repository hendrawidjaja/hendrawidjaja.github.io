import { useState } from "react";
import { Cpu, Edit, Plus, Trash2 } from "@/src/components/Icons";
import { useAuth } from "@/src/context/AuthContext";
import type { SkillCategory } from "@/src/types/cv";
import { Button } from "@/src/ui/Button";

interface SectionSkillsProps {
  categories: SkillCategory[];
  onAddCategory: () => void;
  onDeleteCategory: (id: string, name: string) => void;
  onEditCategory: (cat: SkillCategory) => void;
}

export const SectionSkills = ({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: SectionSkillsProps) => {
  const { isEditMode } = useAuth();
  const [activeTab, _] = useState<string>("all");

  const filteredCategories =
    activeTab === "all" ? categories : categories.filter((c) => c.id === activeTab);

  return (
    <section className="border-b border-slate-300 py-12 sm:py-16 dark:border-slate-800" id="skills">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Skills & Technical Expertise
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Languages, distributed platforms, architectural disciplines, and engineering
              toolchains
            </p>
          </div>

          {isEditMode && (
            <Button
              className="no-print flex items-center gap-1.5 self-start rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 sm:self-auto"
              onClick={onAddCategory}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Skill Category</span>
            </Button>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
            No skill categories defined yet.
            {isEditMode && 'Click "Add Skill Category" to build your competencies.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredCategories.map((cat) => (
              <div
                className="page-break-avoid flex flex-col justify-between rounded-xl border border-slate-300 bg-white p-6 shadow-xs transition-all hover:border-slate-400 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700"
                key={cat.id}
              >
                <div className="mb-4 flex items-center justify-between border-b border-slate-300 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {cat.name}
                    </h3>
                  </div>

                  {isEditMode && (
                    <div className="no-print flex items-center gap-1">
                      <Button
                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        onClick={() => onEditCategory(cat)}
                        title="Edit this category"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                        onClick={() => onDeleteCategory(cat.id, cat.name)}
                        title="Remove this category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill) => (
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        skill.featured
                          ? "border-blue-200 bg-blue-50/70 font-semibold text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200"
                          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-300"
                      }`}
                      key={skill.name}
                    >
                      {skill.icon ? (
                        /* biome-ignore lint/performance/noImgElement: local skill logo */
                        <img
                          alt=""
                          className="h-4 w-4 shrink-0 object-contain dark:brightness-125"
                          loading="lazy"
                          src={skill.icon}
                        />
                      ) : (
                        <span className="grid h-4 w-4 shrink-0 place-items-center rounded-sm bg-slate-200 text-[9px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {skill.name.trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span>{skill.name}</span>
                      {skill.level && (
                        <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                          ({skill.level})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};