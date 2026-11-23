import { BtnEditDelete } from "@/src/components/BtnEditDelete";
import { Award, Calendar, GraduationCap, MapPin } from "@/src/components/Icons";
import { SectionShell } from "@/src/components/section/SectionShell";
import { useAuth } from "@/src/context/AuthContext";
import type { Education } from "@/src/types/cv";
import { toRenderableHtml } from "@/src/utils/richText";

interface SectionEducationProps {
  education: Education[];
  onAddEducation: () => void;
  onDeleteEducation: (id: string, degree: string, institution: string) => void;
  onEditEducation: (edu: Education) => void;
}

export const SectionEducation = ({
  education,
  onAddEducation,
  onDeleteEducation,
  onEditEducation,
}: SectionEducationProps) => {
  const { isEditMode } = useAuth();

  return (
    <SectionShell
      addLabel="Add Education"
      id="education"
      isEditMode={isEditMode}
      onAdd={onAddEducation}
      subtitle="Degrees, formal research, academic honors, and foundational training"
      title="Education & Academic Credentials"
    >
      {education.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          No education entries yet.
          {isEditMode && 'Click "Add Education" to add your academic background.'}
        </div>
      ) : (
        <div className="print-stack grid grid-cols-1 gap-6 md:grid-cols-2">
          {education.map((edu) => (
            <div
              className={`page-break-avoid flex flex-col justify-between ${"rounded-xl border border-slate-300 bg-white p-6 shadow-xs transition-all hover:border-slate-400 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700"}`}
              key={edu.id}
            >
              <div className="flex w-full justify-between gap-2">
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0 rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    {edu.logo ? (
                      /* biome-ignore lint/performance/noImgElement: uploaded or local institution logo */
                      <img
                        alt="logo"
                        className="h-16 w-16 object-contain"
                        loading="lazy"
                        src={edu.logo}
                      />
                    ) : (
                      <GraduationCap className="h-5 w-5" />
                    )}
                  </div>

                  <div className="relative">
                    <h3 className="text-base leading-tight font-bold text-slate-900 sm:text-lg dark:text-white">
                      {edu.degree}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {edu.field}
                    </p>
                  </div>
                </div>

                {isEditMode && (
                  <BtnEditDelete
                    deleteTitle="Remove this entry"
                    editTitle="Edit this entry"
                    onDelete={() => onDeleteEducation(edu.id, edu.degree, edu.institution)}
                    onEdit={() => onEditEducation(edu)}
                  />
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {edu.institution}
                </span>
                {edu.location && (
                  <>
                    <span aria-hidden="true" className="mx-2">
                      ·
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {edu.location}
                    </span>
                  </>
                )}
                <span aria-hidden="true" className="mx-2">
                  ·
                </span>
                <span className="flex items-center gap-1 font-mono tabular-nums">
                  <Calendar className="h-3 w-3" />
                  {edu.startYear} — {edu.endYear}
                </span>
              </div>

              {edu.honors && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  <Award className="h-3.5 w-3.5" />
                  <span>{edu.honors}</span>
                </div>
              )}

              {edu.highlights && edu.highlights.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {edu.highlights.map((item) => (
                    <li className="flex items-center gap-2" key={item}>
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                      <span
                        className="rich-text leading-relaxed"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: Biome Problem
                        dangerouslySetInnerHTML={{ __html: toRenderableHtml(item) }}
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