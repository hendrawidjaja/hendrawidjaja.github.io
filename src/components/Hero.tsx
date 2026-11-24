import { IconSize } from "@/constant";
import { AvatarImage } from "@/src/ui/AvatarImage";
import { Button } from "@/src/ui/Button";
import { useAuth } from "../context/AuthContext";
import type { CVProfile } from "../types/cv";
import { toRenderableHtml } from "../utils/richText";
import { Briefcase, Download, Edit, Github, Linkedin, Mail, MapPin, Phone } from "./Icons";

interface HeroProps {
  onEditProfile: () => void;
  onOpenPdfModal: () => void;
  profile: CVProfile;
}

const sharedClass: string =
  "mr-4 flex items-center gap-1.5 transition-colors hover:text-blue-600 dark:hover:text-blue-400";

export const Hero = ({ profile, onEditProfile, onOpenPdfModal }: HeroProps) => {
  const { isEditMode } = useAuth();

  return (
    <section
      className="relative border-b border-slate-300 pt-10 pb-12 sm:pt-14 sm:pb-16 dark:border-slate-800"
      id="top"
    >
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        {isEditMode && (
          <div className="no-print mb-6 flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 sm:flex-row sm:items-center sm:justify-between sm:text-sm dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Admin Edit Mode:</span>
              <span>You can add, edit, or remove entries across any CV section below.</span>
            </div>

            <Button
              className="shrink-0 self-start rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              onClick={onEditProfile}
            >
              Edit Profile Info
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12 print:grid-cols-12 print:gap-6">
          <div className="flex flex-col lg:col-span-8 print:col-span-10">
            {/* Toggle: the checkbox in Edit Profile Info shows/hides this whole line. */}
            {profile.availableForHire && (
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-400">
                  Active Status
                </span>
                <span aria-hidden="true">·</span>
                <span>{profile.statusText || "Open to Staff & Executive Opportunities"}</span>
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl leading-[1.15] font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
                  {profile.name}
                </h1>
                <p className="mt-2 text-lg leading-snug font-medium text-blue-600 sm:text-xl dark:text-blue-400">
                  {profile.title}
                </p>
              </div>

              {isEditMode && (
                <Button
                  className="no-print shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-blue-400"
                  onClick={onEditProfile}
                  title="Edit Profile"
                >
                  <Edit className={IconSize} />
                </Button>
              )}
            </div>

            <p className="mt-4 text-base leading-relaxed font-normal text-balance text-slate-700 sm:text-lg dark:text-slate-300">
              {profile.headline}
            </p>

            <div
              className="rich-text mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: no explanation
              dangerouslySetInnerHTML={{ __html: toRenderableHtml(profile.summary) }}
            />

            <div className="mt-6 flex flex-wrap items-center gap-y-2 text-xs text-slate-600 sm:text-sm dark:text-slate-400">
              {profile.location && (
                <div className="mr-4 flex items-center gap-1.5">
                  <MapPin className={`${IconSize} text-slate-400`} />
                  <span>{profile.location}</span>
                </div>
              )}

              {profile.email && (
                <a className={sharedClass} href={`mailto:${profile.email}`}>
                  <Mail className={`${IconSize} text-slate-400`} />
                  <span>{profile.email}</span>
                </a>
              )}

              {profile.phone && (
                <a className={sharedClass} href={`tel:${profile.phone}`}>
                  <Phone className={`${IconSize} text-slate-400`} />
                  <span>{profile.phone}</span>
                </a>
              )}

              {profile.linkedin && (
                <a
                  className={sharedClass}
                  href={profile.linkedin}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Linkedin className={`${IconSize} text-slate-400`} />
                  <span>LinkedIn</span>
                  <span className="export-url text-slate-400">
                    {profile.linkedin.replace(/^https?:\/\//, "")}
                  </span>
                </a>
              )}

              {profile.github && (
                <a
                  className={sharedClass}
                  href={profile.github}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Github className={`${IconSize} text-slate-400`} />
                  <span>GitHub</span>
                  <span className="export-url text-slate-400">
                    {profile.github.replace(/^https?:\/\//, "")}
                  </span>
                </a>
              )}
            </div>

            <div className="no-print no-export mt-8 flex flex-wrap items-center gap-3">
              <Button
                className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium whitespace-nowrap text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:text-sm dark:bg-blue-600 dark:hover:bg-blue-500"
                onClick={onOpenPdfModal}
              >
                <Download className={IconSize} />
                <span>Export PDF Resume</span>
              </Button>

              <a
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80"
                href={`mailto:${profile.email}`}
              >
                <Briefcase className={`${IconSize} text-slate-500`} />
                <span>Inquire for Roles</span>
              </a>
            </div>
          </div>

          {/* Printed beside the name, not the 1/3-width screen column; the top
              margin lines it up with the h1 under the optional status line. */}
          <div
            className={`flex flex-col items-center lg:col-span-4 lg:items-end print:col-span-2 print:items-start${
              profile.availableForHire ? "print:mt-7" : ""
            }`}
          >
            <div className="relative h-48 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-md sm:h-56 sm:w-56 lg:h-64 lg:w-64 dark:border-slate-800 dark:bg-slate-900 print:h-20 print:w-20">
              <AvatarImage name={profile.name} src={profile.avatarUrl} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};