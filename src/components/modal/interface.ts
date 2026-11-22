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

export interface RegisterState {
  confirmPass: string;
  error: string | null;
  password: string;
  username: string;
}

export interface LoginState {
  error: string | null;
  isLoading: boolean;
  password: string;
  username: string;
}

export interface PasswordState {
  confirmPass: string;
  currentPass: string;
  error: string | null;
  newPass: string;
}
export interface ModalDeleteConfirmProps {
  isDeleting: boolean;
  itemName: string;
  itemType: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
}

export type EditableEntity =
  | CVProfile
  | WorkExperience
  | Education
  | SkillCategory
  | Project
  | PortfolioItem;

type EditableEntityPayload =
  | Partial<WorkExperience>
  | Partial<Education>
  | Partial<SkillCategory>
  | Partial<Project>
  | Partial<PortfolioItem>;

export type { EditableEntityPayload };

export interface EditItemModalProps {
  initialData?: EditableEntity | null;
  onClose: () => void;
  onSaveEntity: (
    kind: Exclude<ModalType, "profile">,
    data: EditableEntityPayload,
    isNew: boolean,
  ) => Promise<void>;
  onSaveProfile: (profile: CVProfile) => Promise<void>;
  open: boolean;
  type: ModalType;
}
export interface ModalPdfExportProps {
  cvData: CVData;
  onClose: () => void;
  open: boolean;
}
export interface ModalPortfolioProps {
  item: PortfolioItem | null;
  onClose: () => void;
  open: boolean;
}