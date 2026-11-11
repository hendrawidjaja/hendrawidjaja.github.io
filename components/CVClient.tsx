"use client";

import { useEffect, useState } from "react";
import {
  createEducationAction,
  createExperienceAction,
  createPortfolioItemAction,
  createProjectAction,
  createSkillCategoryAction,
  deleteEducationAction,
  deleteExperienceAction,
  deletePortfolioItemAction,
  deleteProjectAction,
  deleteSkillCategoryAction,
  updateEducationAction,
  updateExperienceAction,
  updatePortfolioItemAction,
  updateProfileAction,
  updateProjectAction,
  updateSkillCategoryAction,
} from "@/app/actions";
import { Footer } from "@/src/components/Footer";
import { Header } from "@/src/components/Header";
import { Hero } from "@/src/components/Hero";
import { ModalAdmin } from "@/src/components/modal/ModalAdmin";
import { ModalDeleteConfirm } from "@/src/components/modal/ModalDeleteConfirm";
import type { EditableEntity, EditableEntityPayload } from "@/src/components/modal/ModalEditItem";
import { ModalEditItem } from "@/src/components/modal/ModalEditItem";
import { ModalPdfExport } from "@/src/components/modal/ModalPdfExport";
import { SectionEducation } from "@/src/components/section/SectionEducation";
import { SectionExperience } from "@/src/components/section/SectionExperience";
import { SectionPortfolio } from "@/src/components/section/SectionPortfolio";
import { SectionProjects } from "@/src/components/section/SectionProjects";
import { SectionSkills } from "@/src/components/section/SectionSkills";
import { ToastProvider, useToast } from "@/src/components/Toast";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { getStoredToken, setStoredToken } from "@/src/services/api";
import type {
  CVData,
  CVProfile,
  Education,
  ModalType,
  PortfolioItem,
  Project,
  SkillCategory,
  WorkExperience,
} from "@/src/types/cv";

type DeleteSaveKind = "Experience" | "Education" | "Skill Category" | "Project" | "Portfolio";

interface DeleteConfig {
  action: (token: string, id: string) => Promise<void>;
  listKey: "experiences" | "education" | "skillCategories" | "projects" | "portfolio";
}

function CVInner({ initialData }: { initialData: CVData }) {
  const { showToast } = useToast();
  const { openLoginModal } = useAuth();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [cvData, setCvData] = useState<CVData>(initialData);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  interface EditModalState {
    data: EditableEntity | null;
    type: ModalType | null;
  }

  interface DeleteActionState {
    isDeleting: boolean;
    target: {
      id?: string;
      type: DeleteSaveKind;
      name: string;
    } | null;
  }

  const [editModal, setEditModal] = useState<EditModalState>({ type: null, data: null });
  const [deleteAction, setDeleteAction] = useState<DeleteActionState>({
    target: null,
    isDeleting: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme_preference");
      const shouldDark = stored
        ? stored === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(shouldDark);
      if (shouldDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme_preference", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme_preference", "light");
      }
      return next;
    });
  };

  const openEdit = (type: ModalType, data: EditableEntity | null) => {
    setEditModal({ type, data });
  };

  const handleSaveProfile = async (updated: CVProfile) => {
    const token = getStoredToken();
    if (!token) throw new Error("Unauthorized");
    try {
      const res = await updateProfileAction(token, updated);
      setCvData((prev) => ({ ...prev, profile: res }));
      showToast("Profile information updated", "success");
    } catch (err: unknown) {
      handleAuthError(err);
      throw err;
    }
  };

  type IdEntity = Exclude<EditableEntity, CVProfile>;

  interface EntitySaveConfig {
    create: (token: string, data: unknown) => Promise<IdEntity>;
    insertAtTop: boolean;
    listKey: "experiences" | "education" | "skillCategories" | "projects" | "portfolio";
    toast: { created: string; updated: string };
    update: (token: string, id: string, data: unknown) => Promise<IdEntity>;
  }

  const SAVE_CONFIG: Record<DeleteSaveKind, EntitySaveConfig> = {
    Experience: {
      create: (token, data) => createExperienceAction(token, data as Omit<WorkExperience, "id">),
      update: (token, id, data) => updateExperienceAction(token, id, data),
      listKey: "experiences",
      insertAtTop: true,
      toast: {
        created: "Work experience entry added",
        updated: "Work experience entry updated",
      },
    },

    Education: {
      create: (token, data) => createEducationAction(token, data as Omit<Education, "id">),
      update: (token, id, data) => updateEducationAction(token, id, data),
      listKey: "education",
      insertAtTop: false,
      toast: {
        created: "Education credential added",
        updated: "Education credential updated",
      },
    },

    ["Skill Category"]: {
      create: (token, data) => createSkillCategoryAction(token, data as Omit<SkillCategory, "id">),
      update: (token, id, data) => updateSkillCategoryAction(token, id, data),
      listKey: "skillCategories",
      insertAtTop: false,
      toast: { created: "Skill category added", updated: "Skill category updated" },
    },

    Project: {
      create: (token, data) => createProjectAction(token, data as Omit<Project, "id">),
      update: (token, id, data) => updateProjectAction(token, id, data),
      listKey: "projects",
      insertAtTop: true,
      toast: {
        created: "Project added to showcase",
        updated: "Project updated successfully",
      },
    },

    Portfolio: {
      create: (token, data) => createPortfolioItemAction(token, data as Omit<PortfolioItem, "id">),
      update: (token, id, data) => updatePortfolioItemAction(token, id, data),
      listKey: "portfolio",
      insertAtTop: true,
      toast: {
        created: "Portfolio item added",
        updated: "Portfolio item updated",
      },
    },
  };

  const kindByType = {
    experience: "Experience",
    education: "Education",
    skillCategory: "Skill Category",
    project: "Project",
    portfolio: "Portfolio",
  } as const;

  /**
   * A stored token can go invalid (expiry or server restart of older builds)
   * without the client knowing. Recover interactively instead of throwing a
   * bare "Unauthorized" into the console.
   */
  const handleAuthError = (err: unknown) => {
    if (err instanceof Error && err.message.includes("Unauthorized")) {
      setStoredToken(null);
      showToast("Session expired — please log in again", "error");
      openLoginModal();
    }
  };

  const handleSaveEntity = async (
    kind: Exclude<ModalType, "profile">,
    data: EditableEntityPayload,
    isNew: boolean,
  ) => {
    const token = getStoredToken();
    if (!token) throw new Error("Unauthorized");
    const cfg = SAVE_CONFIG[kindByType[kind]];

    try {
      if (isNew) {
        const created = await cfg.create(token, data);
        setCvData((prev) => {
          const list = prev[cfg.listKey];
          return {
            ...prev,
            [cfg.listKey]: cfg.insertAtTop ? [created, ...list] : [...list, created],
          };
        });
        showToast(cfg.toast.created, "success");
      } else {
        // biome-ignore lint/style/noNonNullAssertion: Biome Problem
        const updated = await cfg.update(token, data.id!, data);
        setCvData((prev) => ({
          ...prev,
          [cfg.listKey]: prev[cfg.listKey].map((e) => (e.id === updated.id ? updated : e)),
        }));
        showToast(cfg.toast.updated, "success");
      }
    } catch (err: unknown) {
      handleAuthError(err);
      throw err;
    }
  };

  const handleDeleteExperience = (id: string, role: string, company: string) => {
    setDeleteAction((prev) => ({
      ...prev,
      target: { id, type: "Experience", name: `${role} at ${company}` },
    }));
  };

  const handleDeleteEducation = (id: string, degree: string, institution: string) => {
    setDeleteAction((prev) => ({
      ...prev,
      target: { id, type: "Education", name: `${degree} from ${institution}` },
    }));
  };

  const handleDeleteSkillCategory = (id: string, name: string) => {
    setDeleteAction((prev) => ({ ...prev, target: { id, type: "Skill Category", name } }));
  };

  const handleDeleteProject = (id: string, name: string) => {
    setDeleteAction((prev) => ({ ...prev, target: { id, type: "Project", name } }));
  };

  const handleDeletePortfolioItem = (id: string, name: string) => {
    setDeleteAction((prev) => ({ ...prev, target: { id, type: "Portfolio", name } }));
  };

  const DELETE_CONFIG: Record<DeleteSaveKind, DeleteConfig> = {
    Experience: { action: deleteExperienceAction, listKey: "experiences" },
    Education: { action: deleteEducationAction, listKey: "education" },
    "Skill Category": {
      action: deleteSkillCategoryAction,
      listKey: "skillCategories",
    },
    Project: { action: deleteProjectAction, listKey: "projects" },
    Portfolio: { action: deletePortfolioItemAction, listKey: "portfolio" },
  };

  const handleConfirmDelete = async () => {
    if (!deleteAction.target) return;
    const token = getStoredToken();
    if (!token) return;
    setDeleteAction((prev) => ({ ...prev, isDeleting: true }));
    try {
      const cfg = DELETE_CONFIG[deleteAction.target.type];
      await cfg.action(token, deleteAction.target.id);
      setCvData((prev) => ({
        ...prev,
        [cfg.listKey]: prev[cfg.listKey].filter((e) => e.id !== deleteAction.target?.id),
      }));
      showToast(`Removed "${deleteAction.target.name}" successfully`, "info");
      setDeleteAction((prev) => ({ ...prev, target: null }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deletion failed";
      showToast(msg, "error");
    } finally {
      setDeleteAction((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Header
        isDark={isDark}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onToggleTheme={toggleTheme}
      />

      <main
        className="w-full flex-1 bg-slate-50 transition-colors dark:bg-slate-950"
        id="cv-printable-area"
      >
        <Hero
          onEditProfile={() => openEdit("profile", cvData.profile)}
          onOpenPdfModal={() => setIsPdfModalOpen(true)}
          profile={cvData.profile}
        />

        <SectionExperience
          experiences={cvData.experiences}
          onAddExperience={() => openEdit("experience", null)}
          onDeleteExperience={handleDeleteExperience}
          onEditExperience={(exp) => openEdit("experience", exp)}
        />

        <SectionProjects
          onAddProject={() => openEdit("project", null)}
          onDeleteProject={handleDeleteProject}
          onEditProject={(proj) => openEdit("project", proj)}
          projects={cvData.projects}
        />

        <SectionPortfolio
          items={cvData.portfolio}
          onAddItem={() => openEdit("portfolio", null)}
          onDeleteItem={handleDeletePortfolioItem}
          onEditItem={(item) => openEdit("portfolio", item)}
        />

        <SectionSkills
          categories={cvData.skillCategories}
          onAddCategory={() => openEdit("skillCategory", null)}
          onDeleteCategory={handleDeleteSkillCategory}
          onEditCategory={(cat) => openEdit("skillCategory", cat)}
        />

        <SectionEducation
          education={cvData.education}
          onAddEducation={() => openEdit("education", null)}
          onDeleteEducation={handleDeleteEducation}
          onEditEducation={(edu) => openEdit("education", edu)}
        />
      </main>

      <Footer />

      <ModalAdmin />

      <ModalEditItem
        initialData={editModal.data}
        isOpen={Boolean(editModal.type)}
        onClose={() => setEditModal({ type: null, data: null })}
        onSaveEntity={handleSaveEntity}
        onSaveProfile={handleSaveProfile}
        type={editModal.type}
      />

      <ModalDeleteConfirm
        isDeleting={deleteAction.isDeleting}
        isOpen={Boolean(deleteAction.target)}
        itemName={deleteAction.target?.name || ""}
        itemType={deleteAction.target?.type || ""}
        onCancel={() => setDeleteAction((prev) => ({ ...prev, target: null }))}
        onConfirm={handleConfirmDelete}
      />

      <ModalPdfExport
        cvData={cvData}
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />
    </div>
  );
}

export function CVClient({ initialData }: { initialData: CVData }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CVInner initialData={initialData} />
      </AuthProvider>
    </ToastProvider>
  );
}