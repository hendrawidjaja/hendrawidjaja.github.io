import { useAuth } from "../../context/AuthContext";
import type { WorkExperience } from "../../types/cv";
import { toRenderableHtml } from "../../utils/richText";
import { BtnEditDelete } from "../BtnEditDelete";
import { Building2, Calendar, MapPin } from "../Icons";
import { CardShell } from "./CardShell";
import { SectionShell } from "./SectionShell";

interface SectionExperienceProps {
  experiences: WorkExperience[];
  onAddExperience: () => void;
  onDeleteExperience: (id: string, role: string, company: string) => void;
  onEditExperience: (exp: WorkExperience) => void;
}

export const SectionExperience = ({
  experiences,
  onAddExperience,
  onEditExperience,
  onDeleteExperience,
}: SectionExperienceProps) => {
  const { isEditMode } = useAuth();

  return (
    <SectionShell
      addLabel="Add Experience"
      id="experience"
      isEditMode={isEditMode}
      onAdd={onAddExperience}
      subtitle="Career progression, system leadership, and high-impact accomplishments"
      title="Work Experience"
    >
      {experiences.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          No work experience entries yet.{" "}
          {isEditMode && 'Click "Add Experience" to add your first position.'}
        </div>
      ) : (
        <div className="space-y-10">
          {experiences.map((exp) => (
            <div
              className="group page-break-avoid relative border-slate-200 pl-0 transition-colors sm:border-l-2 sm:pl-6 dark:border-slate-800"
              key={exp.id}
            >
              <div className="absolute top-1.5 -left-1.75 hidden h-3 w-3 rounded-full bg-slate-300 transition-colors group-hover:bg-blue-600 sm:block dark:bg-slate-700" />

              <CardShell>
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                      {exp.role}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                        <Building2 className="h-3.5 w-3.5" />
                        {exp.company}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                        ·
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                        {exp.location}
                      </span>

                      {exp.type && (
                        <>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                            ·
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {exp.type}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums sm:text-sm dark:text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {exp.startDate} — {exp.current ? "Present" : exp.endDate}
                      </span>
                    </span>

                    {isEditMode && (
                      <BtnEditDelete
                        deleteTitle="Remove this role"
                        editTitle="Edit this role"
                        onDelete={() => onDeleteExperience(exp.id, exp.role, exp.company)}
                        onEdit={() => onEditExperience(exp)}
                      />
                    )}
                  </div>
                </div>

                {exp.summary && (
                  <div
                    className="rich-text mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: Biome Problem
                    dangerouslySetInnerHTML={{ __html: toRenderableHtml(exp.summary) }}
                  />
                )}

                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {exp.highlights.map((highlight) => (
                      <li className="flex items-center gap-2.5" key={highlight}>
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 dark:bg-blue-400" />
                        <span
                          className="rich-text leading-relaxed"
                          // biome-ignore lint/security/noDangerouslySetInnerHtml: Biome Problem
                          dangerouslySetInnerHTML={{ __html: toRenderableHtml(highlight) }}
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-300 pt-4 dark:border-slate-800">
                    <span className="mr-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                      Tech Stack:
                    </span>
                    {exp.technologies.map((tech) => (
                      <span
                        className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-300"
                        key={tech}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </CardShell>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
};