import Image from "next/image";
import { useEffect, useState } from "react";
import {
  IconSize,
  INITIAL_EDUCATION,
  INITIAL_EXPERIENCE,
  INITIAL_PORTFOLIO,
  INITIAL_PROJECT,
} from "@/constant";
import type { EditItemModalProps } from "@/src/components/modal/interface";
import { RichTextEditor } from "@/src/components/RichTextEditor";
import { Button } from "@/src/ui/Button";
import { TextField } from "@/src/ui/TextField";
import type { CVProfile } from "../../types/cv";
import { AlertCircle, GraduationCap, Plus, Trash2, Upload, X } from "../Icons";
import { DialogShell } from "./DialogShell";

const labelClass = "mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300";
const gridClass = "grid grid-cols-1 gap-4 sm:grid-cols-2";

type AnyForm = Record<string, any>;

export const ModalEditItem = ({
  type,
  onClose,
  onSaveProfile,
  onSaveEntity,
  open,
  initialData,
}: EditItemModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<AnyForm>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * Read an uploaded logo into a data URL; it is stored inside the record, so
   * nothing else has to be deployed. Blank leaves the automatic logo in charge.
   */
  const uploadLogo = (file: File | undefined, apply: (src: string) => void) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSaveError("Logo must be an image file");
      return;
    }
    if (file.size > 500 * 1024) {
      setSaveError("Logo must be 500 KB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => apply(String(reader.result));
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (initialData) {
      setFormData(JSON.parse(JSON.stringify(initialData)));
    } else {
      if (type === "experience") {
        setFormData({
          ...INITIAL_EXPERIENCE,
        });
      } else if (type === "education") {
        setFormData({
          ...INITIAL_EDUCATION,
        });
      } else if (type === "skillCategory") {
        setFormData({
          name: "",
          skills: [{ name: "", level: "Expert", featured: true }],
        });
      } else if (type === "project") {
        setFormData({
          ...INITIAL_PROJECT,
        });
      } else if (type === "portfolio") {
        setFormData({
          ...INITIAL_PORTFOLIO,
        });
      } else if (type === "profile") {
        setFormData({});
      }
    }
  }, [type, initialData]);

  if (!type) return null;

  const isNew = !initialData || !("id" in initialData) || !initialData.id;

  const handleSubmit = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      if (type === "profile") {
        await onSaveProfile(formData as CVProfile);
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

  const title = isNew
    ? `Add New ${type === "skillCategory" ? "Skill Category" : type}`
    : `Edit ${type === "skillCategory" ? "Skill Category" : type}`;

  const header = (
    <div className="header">
      <h3 className="text-lg font-bold text-slate-900 capitalize dark:text-white">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Update and save changes immediately to the CV
      </p>
    </div>
  );

  return (
    <DialogShell className="max-w-3xl" header={header} onClose={onClose} open={open}>
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
                    className={`pointer-events-none absolute top-0.5 left-0.5 ${IconSize} translate-x-0 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-4`}
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
                  <Plus className={IconSize} /> Add Highlight
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
                      const next = formData.highlights.filter((_, i: number) => i !== index);
                      setFormData({ ...formData, highlights: next });
                    }}
                  >
                    <Trash2 className={IconSize} />
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

            <div className="flex items-center gap-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                {formData.logo ? (
                  <Image
                    alt="Institution"
                    className="h-full w-full object-contain"
                    fill
                    src={formData.logo}
                    unoptimized
                  />
                ) : (
                  <GraduationCap className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div>
                <label className="cursor-pointer text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                  {formData.logo ? "Replace logo" : "Upload logo"}
                  <input
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      uploadLogo(event.target.files?.[0], (logo) =>
                        setFormData({ ...formData, logo }),
                      )
                    }
                    type="file"
                  />
                </label>
                {formData.logo && (
                  <button
                    className="ml-3 text-xs text-slate-500 hover:text-rose-500"
                    onClick={() => setFormData({ ...formData, logo: "" })}
                    type="button"
                  >
                    Remove
                  </button>
                )}
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Blank uses <code>public/img/education/&lt;institution&gt;.svg</code>, else the
                  graduation cap.
                </p>
              </div>
            </div>

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
              id="category-name"
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
                  <Plus className={IconSize} /> Add Skill
                </Button>
              </div>

              <p className="mb-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                Upload a logo per skill. Left blank, it uses{" "}
                <code>public/img/skills/&lt;skill-name&gt;.svg</code> (lowercase, spaces dashed),
                then a letter badge.
              </p>

              {/** biome-ignore lint/suspicious/noExplicitAny: Biome Problem */}
              {(formData.skills || []).map((skill: any, index: number) => (
                <div
                  className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700/60 dark:bg-slate-800/60"
                  // biome-ignore lint/suspicious/noArrayIndexKey:Biome Problem
                  key={index}
                >
                  <input
                    className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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

                  <label
                    className="flex cursor-pointer items-center gap-1 rounded p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                    title="Upload a logo (blank keeps the automatic logo)"
                  >
                    {skill.logo || skill.icon ? (
                      <Image
                        alt="logo skill"
                        className="h-4 w-4 object-contain"
                        fill
                        sizes="100vw"
                        src={skill.logo || skill.icon}
                        unoptimized
                      />
                    ) : (
                      <Upload className={IconSize} />
                    )}
                    <input
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        uploadLogo(event.target.files?.[0], (logo) => {
                          const next = [...formData.skills];
                          next[index] = { ...next[index], logo };
                          setFormData({ ...formData, skills: next });
                        })
                      }
                      type="file"
                    />
                  </label>

                  {skill.logo && (
                    <Button
                      className="rounded p-1 text-slate-400 hover:text-rose-500"
                      onClick={() => {
                        const next = [...formData.skills];
                        next[index] = { ...next[index], logo: "" };
                        setFormData({ ...formData, skills: next });
                      }}
                      title="Remove uploaded logo"
                    >
                      <X className={IconSize} />
                    </Button>
                  )}

                  <Button
                    className="rounded p-1 text-slate-400 hover:text-rose-500"
                    onClick={() => {
                      // biome-ignore lint/suspicious/noExplicitAny: Biome Problem
                      const next = formData.skills.filter((_: any, i: number) => i !== index);
                      setFormData({ ...formData, skills: next });
                    }}
                  >
                    <Trash2 className={IconSize} />
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

        {type === "portfolio" && (
          <div className="space-y-4">
            <div className={gridClass}>
              <TextField
                className="portfolio-title"
                label="Piece Title *"
                onChange={(v) => setFormData({ ...formData, title: v })}
                placeholder="e.g. Renos Marketplace"
                required
                value={formData.title || ""}
              />
              <TextField
                className="tagline"
                label="Tagline"
                onChange={(v) => setFormData({ ...formData, tagline: v })}
                placeholder="e.g. Visual case study"
                value={formData.tagline || ""}
              />
            </div>

            <div>
              <span className={labelClass}>Description</span>
              <RichTextEditor
                label="Portfolio Description"
                onChange={(html) => setFormData({ ...formData, description: html })}
                placeholder="Describe the work, your role, and the outcome…"
                rows={3}
                value={formData.description || ""}
              />
            </div>

            <div className={gridClass}>
              <TextField
                className="year"
                label="Year"
                onChange={(v) => setFormData({ ...formData, year: v })}
                value={formData.year || ""}
              />
              <TextField
                className="portfolio-link"
                label="Project / Case Study URL"
                onChange={(v) => setFormData({ ...formData, link: v })}
                type="url"
                value={formData.link || ""}
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

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Images
                </span>
                <Button
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      images: [...(formData.images || []), ""],
                    })
                  }
                >
                  <Plus className={IconSize} /> Add Image
                </Button>
              </div>

              <p className="mb-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                Files in{" "}
                <code>
                  public/img/portfolio/
                  {initialData && "id" in initialData ? initialData.id : "<id>"}/
                </code>{" "}
                load automatically, sorted by filename. The URLs below are a fallback when that
                folder is empty.
              </p>

              {(formData.images || []).map((image: string, index: number) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: image order is editable by design
                <div className="mb-2 flex items-center gap-2" key={index}>
                  <div className="h-12 w-16 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    {image ? (
                      <Image
                        alt={`${formData.title || "Portfolio"} preview ${index + 1}`}
                        className="h-full w-full object-cover"
                        fill
                        onError={(event) => {
                          event.currentTarget.style.visibility = "hidden";
                        }}
                        sizes="100vw"
                        src={image}
                        unoptimized
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-[10px] text-slate-400">
                        Preview
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <TextField
                      className="image-url"
                      onChange={(v) => {
                        const next = [...formData.images];
                        next[index] = v;
                        setFormData({ ...formData, images: next });
                      }}
                      placeholder="/portfolio/screenshot.png or https://…"
                      value={image}
                    />
                  </div>

                  <Button
                    className="rounded p-1.5 text-slate-400 hover:text-rose-500"
                    onClick={() => {
                      const next = formData.images.filter((_: string, i: number) => i !== index);
                      setFormData({ ...formData, images: next });
                    }}
                  >
                    <Trash2 className={IconSize} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-slate-300 pt-4 dark:border-slate-800">
          {saveError && (
            <p className="mr-auto flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className={IconSize} />
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
    </DialogShell>
  );
};