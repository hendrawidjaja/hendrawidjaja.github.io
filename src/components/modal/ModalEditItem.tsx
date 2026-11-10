import { useEffect, useState } from "react";
import { RichTextEditor } from "../../components/RichTextEditor";
import { useKeyPress } from "../../hooks/use-keypress";
import type {
  CVProfile,
  Education,
  ModalType,
  Project,
  SkillCategory,
  WorkExperience,
} from "../../types/cv";
import { AlertCircle, Plus, Trash2, X } from "../Icons";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";

export type EditableEntity = CVProfile | WorkExperience | Education | SkillCategory | Project;

type EditableEntityPayload =
  | Partial<WorkExperience>
  | Partial<Education>
  | Partial<SkillCategory>
  | Partial<Project>;

export type { EditableEntityPayload };

const labelClass = "mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300";
const gridClass = "grid grid-cols-1 gap-4 sm:grid-cols-2";

interface EditItemModalProps {
  initialData?: EditableEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveEntity: (
    kind: Exclude<ModalType, "profile">,
    data: EditableEntityPayload,
    isNew: boolean,
  ) => Promise<void>;
  onSaveProfile: (profile: CVProfile) => Promise<void>;
  type: ModalType;
}
export const ModalEditItem = ({
  type,
  isOpen,
  onClose,
  onSaveProfile,
  onSaveEntity,
  initialData,
}: EditItemModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  // biome-ignore lint/suspicious/noExplicitAny: Biome Problem
  const [formData, setFormData] = useState<any>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  useKeyPress("Escape", onClose, { enabled: isOpen });

  useEffect(() => {
    if (initialData) {
      setFormData(JSON.parse(JSON.stringify(initialData)));
    } else {
      if (type === "experience") {
        setFormData({
          company: "",
          current: true,
          endDate: "Present",
          highlights: [""],
          location: "",
          role: "",
          startDate: "2024",
          summary: "",
          technologies: [],
          type: "Full-time",
        });
      } else if (type === "education") {
        setFormData({
          degree: "",
          endYear: "2024",
          field: "",
          highlights: [""],
          honors: "",
          institution: "",
          location: "",
          startYear: "2020",
        });
      } else if (type === "skillCategory") {
        setFormData({
          name: "",
          skills: [{ name: "", level: "Expert", featured: true }],
        });
      } else if (type === "project") {
        setFormData({
          demoUrl: "",
          description: "",
          featured: false,
          githubUrl: "",
          highlights: [""],
          role: "Lead Architect",
          tagline: "",
          technologies: [],
          title: "",
          year: "2024",
        });
      } else if (type === "profile") {
        setFormData({});
      }
    }
  }, [type, initialData]);

  if (!isOpen || !type) return null;

  const isNew = Boolean(initialData && "id" in initialData && !initialData.id);

  const handleSubmit = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      if (type === "profile") {
        await onSaveProfile(formData);
      } else {
        await onSaveEntity(type, formData, isNew);
      }
      onClose();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="animate-in fade-in zoom-in-95 relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl duration-150 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-300 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 capitalize dark:text-white">
              {isNew
                ? `Add New ${type === "skillCategory" ? "Skill Category" : type}`
                : `Edit ${type === "skillCategory" ? "Skill Category" : type}`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update details and save changes immediately to the CV server
            </p>
          </div>

          <Button
            className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form action={handleSubmit} className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
          {type === "profile" && (
            <div className="space-y-4">
              <div className={gridClass}>
                <TextField
                  className="name"
                  label="Full Name *"
                  onChange={(v) => setFormData({ ...formData, name: v })}
                  required
                  value={formData.name || ""}
                />

                <TextField
                  className="professional"
                  label="Professional Title *"
                  onChange={(v) => setFormData({ ...formData, title: v })}
                  required
                  value={formData.title || ""}
                />
              </div>

              <TextField
                className="headline"
                label="Headline *"
                onChange={(v) => setFormData({ ...formData, headline: v })}
                required
                value={formData.headline || ""}
              />

              <div className="summary">
                <span className={labelClass}>Executive Summary *</span>
                <RichTextEditor
                  label="Executive Summary"
                  onChange={(html) => setFormData({ ...formData, summary: html })}
                  placeholder="Write here…"
                  rows={4}
                  value={formData.summary || ""}
                />
              </div>

              <div className={gridClass}>
                <TextField
                  className="email"
                  label="Email"
                  onChange={(v) => setFormData({ ...formData, email: v })}
                  type="email"
                  value={formData.email || ""}
                />

                <TextField
                  className="phone"
                  label="Phone"
                  onChange={(v) => setFormData({ ...formData, phone: v })}
                  value={formData.phone || ""}
                />
              </div>

              <div className={gridClass}>
                <TextField
                  className="location"
                  label="Location"
                  onChange={(v) => setFormData({ ...formData, location: v })}
                  value={formData.location || ""}
                />

                <TextField
                  className="website"
                  label="Personal Website"
                  onChange={(v) => setFormData({ ...formData, website: v })}
                  type="url"
                  value={formData.website || ""}
                />
              </div>

              <div className={gridClass}>
                <TextField
                  className="linkedin"
                  label="LinkedIn URL"
                  onChange={(v) => setFormData({ ...formData, linkedin: v })}
                  type="url"
                  value={formData.linkedin || ""}
                />

                <TextField
                  className="github"
                  label="GitHub URL"
                  onChange={(v) => setFormData({ ...formData, github: v })}
                  type="url"
                  value={formData.github || ""}
                />
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <div
                  className="flex shrink-0 items-center gap-2 pb-2"
                  title="Show or hide the status line under your name on the hero"
                >
                  <span className="relative inline-block h-5 w-9">
                    <input
                      checked={Boolean(formData.availableForHire)}
                      className="peer absolute inset-0 cursor-pointer opacity-0"
                      id="availableForHire"
                      onChange={(e) =>
                        setFormData({ ...formData, availableForHire: e.target.checked })
                      }
                      type="checkbox"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-blue-600 dark:bg-slate-600 dark:peer-checked:bg-blue-600"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 translate-x-0 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-4"
                    />
                  </span>
                  <label
                    className="cursor-pointer text-xs font-medium text-slate-700 select-none dark:text-slate-300"
                    htmlFor="availableForHire"
                  >
                    Show on hero
                  </label>
                </div>

                <div className="min-w-48 flex-1">
                  <TextField
                    className="availability"
                    label="Status / Availability"
                    onChange={(v) => setFormData({ ...formData, statusText: v })}
                    value={formData.statusText || ""}
                  />
                </div>
              </div>
            </div>
          )}

          {type === "experience" && (
            <div className="space-y-4">
              <div className={gridClass}>
                <TextField
                  className="position"
                  label="Role / Position *"
                  onChange={(v) => setFormData({ ...formData, role: v })}
                  required
                  value={formData.role || ""}
                />

                <TextField
                  className="organization"
                  label="Company / Organization *"
                  onChange={(v) => setFormData({ ...formData, company: v })}
                  required
                  value={formData.company || ""}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <TextField
                  className="location"
                  label="Location"
                  onChange={(v) => setFormData({ ...formData, location: v })}
                  value={formData.location || ""}
                />

                <TextField
                  className="start-date"
                  label="Start Date / Year"
                  onChange={(v) => setFormData({ ...formData, startDate: v })}
                  value={formData.startDate || ""}
                />

                <TextField
                  className="end-date"
                  disabled={formData.current}
                  label="End Date / Year"
                  onChange={(v) => setFormData({ ...formData, endDate: v })}
                  value={formData.current ? "Present" : formData.endDate || ""}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  checked={Boolean(formData.current)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                  id="currentRole"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      current: e.target.checked,
                      endDate: e.target.checked ? "Present" : formData.endDate || "",
                    })
                  }
                  type="checkbox"
                />
                <label
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                  htmlFor="currentRole"
                >
                  I currently work in this role
                </label>
              </div>

              <div>
                <span className={labelClass}>Role Summary</span>
                <RichTextEditor
                  label="Role Summary"
                  onChange={(html) => setFormData({ ...formData, summary: html })}
                  placeholder="Key mandate and organizational scope"
                  rows={2}
                  value={formData.summary || ""}
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Key Achievements & Bullet Points
                  </span>

                  <Button
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        highlights: [...(formData.highlights || []), ""],
                      })
                    }
                  >
                    <Plus className="h-3 w-3" /> Add Highlight
                  </Button>
                </div>

                {(formData.highlights || []).map((item: string, index: number) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Biome Problem
                  <div className="mb-2 flex items-start gap-2" key={index}>
                    <div className="flex-1">
                      <RichTextEditor
                        label={`Highlight ${index + 1}`}
                        onChange={(html) => {
                          const next = [...formData.highlights];
                          next[index] = html;
                          setFormData({ ...formData, highlights: next });
                        }}
                        placeholder={`Achievement point ${index + 1}`}
                        rows={1}
                        value={item}
                      />
                    </div>

                    <Button
                      className="mt-1 rounded p-1.5 text-slate-400 hover:text-rose-500"
                      onClick={() => {
                        // biome-ignore lint/suspicious/noExplicitAny: Biome Problem
                        const next = formData.highlights.filter((_: any, i: number) => i !== index);
                        setFormData({ ...formData, highlights: next });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <TextField
                className="technologies"
                label="Technologies (comma separated)"
                onChange={(v) =>
                  setFormData({
                    ...formData,
                    technologies: v
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="e.g. Rust, Tokio, Kubernetes, PostgreSQL"
                value={Array.isArray(formData.technologies) ? formData.technologies.join(", ") : ""}
              />
            </div>
          )}

          {type === "education" && (
            <div className="space-y-4">
              <div className={gridClass}>
                <TextField
                  className="degree"
                  label="Degree *"
                  onChange={(v) => setFormData({ ...formData, degree: v })}
                  placeholder="e.g. Master of Science (M.Sc.)"
                  required
                  value={formData.degree || ""}
                />

                <TextField
                  className="field-of-study"
                  label="Field of Study *"
                  onChange={(v) => setFormData({ ...formData, field: v })}
                  placeholder="e.g. Computer Science & Distributed Systems"
                  required
                  value={formData.field || ""}
                />
              </div>

              <TextField
                className="institution"
                label="Institution *"
                onChange={(v) => setFormData({ ...formData, institution: v })}
                placeholder="e.g. National University of Singapore"
                required
                value={formData.institution || ""}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <TextField
                  className="location"
                  label="Location"
                  onChange={(v) => setFormData({ ...formData, location: v })}
                  value={formData.location || ""}
                />

                <TextField
                  className="start-year"
                  label="Start Year"
                  onChange={(v) => setFormData({ ...formData, startYear: v })}
                  value={formData.startYear || ""}
                />

                <TextField
                  className="end-year"
                  label="End Year"
                  onChange={(v) => setFormData({ ...formData, endYear: v })}
                  value={formData.endYear || ""}
                />
              </div>

              <TextField
                className="academic-honors"
                label="Academic Honors / GPA"
                onChange={(v) => setFormData({ ...formData, honors: v })}
                placeholder="e.g. Summa Cum Laude, First Class Distinction"
                value={formData.honors || ""}
              />
            </div>
          )}

          {type === "skillCategory" && (
            <div className="space-y-4">
              <TextField
                className="category-name"
                label="Category Name *"
                onChange={(v) => setFormData({ ...formData, name: v })}
                placeholder="e.g. Systems & Core Languages"
                required
                value={formData.name || ""}
              />

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Skills in this Category
                  </span>
                  <Button
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        skills: [
                          ...(formData.skills || []),
                          { name: "", level: "Expert", featured: false },
                        ],
                      })
                    }
                  >
                    <Plus className="h-3 w-3" /> Add Skill
                  </Button>
                </div>

                {/** biome-ignore lint/suspicious/noExplicitAny: Biome Problem */}
                {(formData.skills || []).map((skill: any, index: number) => (
                  <div
                    className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700/60 dark:bg-slate-800/60"
                    // biome-ignore lint/suspicious/noArrayIndexKey:Biome Problem
                    key={index}
                  >
                    <input
                      className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                      onChange={(e) => {
                        const next = [...formData.skills];
                        next[index] = { ...next[index], name: e.target.value };
                        setFormData({ ...formData, skills: next });
                      }}
                      placeholder="Skill name (e.g. Rust)"
                      required
                      type="text"
                      value={skill.name || ""}
                    />
                    <select
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                      onChange={(e) => {
                        const next = [...formData.skills];
                        next[index] = { ...next[index], level: e.target.value };
                        setFormData({ ...formData, skills: next });
                      }}
                      value={skill.level || "Expert"}
                    >
                      <option value="Expert">Expert</option>
                      <option value="Proficient">Proficient</option>
                      <option value="Familiar">Familiar</option>
                    </select>

                    <label className="flex items-center gap-1 text-[11px] whitespace-nowrap text-slate-600 dark:text-slate-400">
                      <input
                        checked={Boolean(skill.featured)}
                        className="rounded text-blue-600"
                        onChange={(e) => {
                          const next = [...formData.skills];
                          next[index] = { ...next[index], featured: e.target.checked };
                          setFormData({ ...formData, skills: next });
                        }}
                        type="checkbox"
                      />
                      <span>Featured</span>
                    </label>

                    <Button
                      className="rounded p-1 text-slate-400 hover:text-rose-500"
                      onClick={() => {
                        // biome-ignore lint/suspicious/noExplicitAny: Biome Problem
                        const next = formData.skills.filter((_: any, i: number) => i !== index);
                        setFormData({ ...formData, skills: next });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === "project" && (
            <div className="space-y-4">
              <div className={gridClass}>
                <TextField
                  className="project-title"
                  label="Project Title *"
                  onChange={(v) => setFormData({ ...formData, title: v })}
                  required
                  value={formData.title || ""}
                />
                <TextField
                  className="tagline"
                  label="Tagline"
                  onChange={(v) => setFormData({ ...formData, tagline: v })}
                  placeholder="e.g. Ultra-low-latency distributed proxy"
                  value={formData.tagline || ""}
                />
              </div>

              <div>
                <span className={labelClass}>Description *</span>
                <RichTextEditor
                  label="Project Description"
                  onChange={(html) => setFormData({ ...formData, description: html })}
                  placeholder="Write here…"
                  rows={3}
                  value={formData.description || ""}
                />
              </div>

              <div className={gridClass}>
                <TextField
                  className="your-role"
                  label="Your Role"
                  onChange={(v) => setFormData({ ...formData, role: v })}
                  placeholder="e.g. Creator & Chief Architect"
                  value={formData.role || ""}
                />
                <TextField
                  className="year"
                  label="Year"
                  onChange={(v) => setFormData({ ...formData, year: v })}
                  value={formData.year || ""}
                />
              </div>

              <div className={gridClass}>
                <TextField
                  className="live-url"
                  label="Demo / Live URL"
                  onChange={(v) => setFormData({ ...formData, demoUrl: v })}
                  type="url"
                  value={formData.demoUrl || ""}
                />
                <TextField
                  className="source-url"
                  label="GitHub / Source URL"
                  onChange={(v) => setFormData({ ...formData, githubUrl: v })}
                  type="url"
                  value={formData.githubUrl || ""}
                />
              </div>

              <TextField
                className="technologies"
                label="Technologies (comma separated)"
                onChange={(v) =>
                  setFormData({
                    ...formData,
                    technologies: v
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                value={Array.isArray(formData.technologies) ? formData.technologies.join(", ") : ""}
              />

              <div className="flex items-center gap-2">
                <input
                  checked={Boolean(formData.featured)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                  id="featuredProject"
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  type="checkbox"
                />
                <label
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                  htmlFor="featuredProject"
                >
                  Feature this project prominently with a star badge
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-300 pt-4 dark:border-slate-800">
            {saveError && (
              <p className="mr-auto flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {saveError}
              </p>
            )}
            <Button
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              disabled={isSaving}
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving Changes..." : "Save to CV"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};