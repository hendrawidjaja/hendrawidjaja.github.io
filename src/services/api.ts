import type { CVProfile, Education, Project, SkillCategory, WorkExperience } from "../types/cv";

const TOKEN_KEY = "executive_cv_auth_token";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Single fetch entry point used by every client-side API call.
 * - Merges auth headers automatically
 * - Parses JSON on success
 * - Throws with the API's error message (or a default) on failure
 */
async function apiRequest<T>(input: RequestInfo | URL, init: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data as { error?: string })?.error || `Request failed with status ${res.status}`,
    );
  }
  return data as T;
}

export async function loginAdmin(
  username: string,
  password: string,
): Promise<{ token: string; user: { username: string }; mustChangePassword?: boolean }> {
  const data = await apiRequest<{
    token: string;
    user: { username: string };
    mustChangePassword?: boolean;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setStoredToken(data.token);
  return data;
}

export async function verifyToken(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;
  try {
    const data = await apiRequest<{ authenticated: boolean }>("/api/auth/verify", {
      headers: getAuthHeaders(),
    });
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function logoutAdmin(): Promise<void> {
  try {
    await apiRequest<void>("/api/auth/logout", { method: "POST" });
  } finally {
    setStoredToken(null);
  }
}

export async function updateProfile(profile: CVProfile): Promise<CVProfile> {
  return apiRequest<CVProfile>("/api/cv/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export async function createExperience(exp: Omit<WorkExperience, "id">): Promise<WorkExperience> {
  return apiRequest<WorkExperience>("/api/cv/experiences", {
    method: "POST",
    body: JSON.stringify(exp),
  });
}

export async function updateExperience(
  id: string,
  exp: Partial<WorkExperience>,
): Promise<WorkExperience> {
  return apiRequest<WorkExperience>(`/api/cv/experiences/${id}`, {
    method: "PUT",
    body: JSON.stringify(exp),
  });
}

export async function deleteExperience(id: string): Promise<void> {
  return apiRequest<void>(`/api/cv/experiences/${id}`, { method: "DELETE" });
}

export async function createEducation(edu: Omit<Education, "id">): Promise<Education> {
  return apiRequest<Education>("/api/cv/education", {
    method: "POST",
    body: JSON.stringify(edu),
  });
}

export async function updateEducation(id: string, edu: Partial<Education>): Promise<Education> {
  return apiRequest<Education>(`/api/cv/education/${id}`, {
    method: "PUT",
    body: JSON.stringify(edu),
  });
}

export async function deleteEducation(id: string): Promise<void> {
  return apiRequest<void>(`/api/cv/education/${id}`, { method: "DELETE" });
}

export async function createSkillCategory(cat: Omit<SkillCategory, "id">): Promise<SkillCategory> {
  return apiRequest<SkillCategory>("/api/cv/skills", {
    method: "POST",
    body: JSON.stringify(cat),
  });
}

export async function updateSkillCategory(
  id: string,
  cat: Partial<SkillCategory>,
): Promise<SkillCategory> {
  return apiRequest<SkillCategory>(`/api/cv/skills/${id}`, {
    method: "PUT",
    body: JSON.stringify(cat),
  });
}

export async function deleteSkillCategory(id: string): Promise<void> {
  return apiRequest<void>(`/api/cv/skills/${id}`, { method: "DELETE" });
}

export async function createProject(proj: Omit<Project, "id">): Promise<Project> {
  return apiRequest<Project>("/api/cv/projects", { method: "POST", body: JSON.stringify(proj) });
}

export async function updateProject(id: string, proj: Partial<Project>): Promise<Project> {
  return apiRequest<Project>(`/api/cv/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(proj),
  });
}

export async function deleteProject(id: string): Promise<void> {
  return apiRequest<void>(`/api/cv/projects/${id}`, { method: "DELETE" });
}