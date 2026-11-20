import { useAuth } from "../../context/AuthContext";
import type { Project } from "../../types/cv";
import { toRenderableHtml } from "../../utils/richText";
import { BtnEditDelete } from "../BtnEditDelete";
import { Code, Star } from "../Icons";
import { SectionShell } from "./SectionShell";

interface SectionProjectsProps {
  onAddProject: () => void;
  onDeleteProject: (id: string, title: string) => void;
  onEditProject: (project: Project) => void;
  projects: Project[];
}

export const SectionProjects = ({
  projects,
  onAddProject,
  onEditProject,
  onDeleteProject,
}: SectionProjectsProps) => {
  const { isEditMode } = useAuth();

  return (
    <SectionShell
      addLabel="Add Project"
      id="projects"
      isEditMode={isEditMode}
      onAdd={onAddProject}
      subtitle="Distributed infrastructure, open-source architectures, and high-throughput systems"
      title="Key Projects & Systems"
    >
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          No projects featured yet.{" "}
          {isEditMode && 'Click "Add Project" to highlight your flagship initiatives.'}
        </div>
      ) : (
        <div className="grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => (
            <div
              className={`page-break-avoid flex flex-col ${"rounded-xl border border-slate-300 bg-white p-6 shadow-xs transition-all hover:border-slate-400 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700"}`}
              key={proj.id}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    <Code className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="min-h-10 text-base leading-tight font-bold text-slate-900 dark:text-white">
                      {proj.title}
                    </h3>
                    {proj.year && (
                      <span className="font-mono text-xs text-slate-400 tabular-nums dark:text-slate-500">
                        {proj.year}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {proj.featured && (
                    <span className="text-amber-500" title="Featured Project">
                      <Star className="h-4 w-4 fill-amber-500" />
                    </span>
                  )}

                  {isEditMode && (
                    <BtnEditDelete
                      deleteTitle="Remove project"
                      editTitle="Edit project"
                      onDelete={() => onDeleteProject(proj.id, proj.title)}
                      onEdit={() => onEditProject(proj)}
                    />
                  )}
                </div>
              </div>

              {proj.tagline && (
                <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {proj.tagline}
                </p>
              )}

              {proj.role && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Role:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {proj.role}
                  </span>
                </p>
              )}

              <div
                className="rich-text mt-3 line-clamp-5 min-h-32.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Biome Problem
                dangerouslySetInnerHTML={{ __html: toRenderableHtml(proj.description) }}
              />

              {proj.highlights && proj.highlights.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {proj.highlights.map((h) => (
                    <li className="flex items-center gap-2" key={h}>
                      <span className="font-bold text-blue-500">›</span>
                      <span
                        className="rich-text leading-relaxed"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: Biome Problem
                        dangerouslySetInnerHTML={{ __html: toRenderableHtml(h) }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
};