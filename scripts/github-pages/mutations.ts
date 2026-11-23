/**
 * Read-only stand-ins for the server actions. `scripts/build-github-pages.sh`
 * copies this over `src/services/mutations.ts`, because static export cannot
 * contain `"use server"` modules. The editor UI is hidden in that build, so
 * these only guard against a stale tab trying to save.
 */
const readOnly = (..._args: unknown[]): Promise<never> =>
  Promise.reject(new Error("This build is read-only."));

export const createEducationAction = readOnly;
export const createExperienceAction = readOnly;
export const createPortfolioItemAction = readOnly;
export const createProjectAction = readOnly;
export const createSkillCategoryAction = readOnly;
export const deleteEducationAction = readOnly;
export const deleteExperienceAction = readOnly;
export const deletePortfolioItemAction = readOnly;
export const deleteProjectAction = readOnly;
export const deleteSkillCategoryAction = readOnly;
export const updateEducationAction = readOnly;
export const updateExperienceAction = readOnly;
export const updatePortfolioItemAction = readOnly;
export const updateProfileAction = readOnly;
export const updateProjectAction = readOnly;
export const updateSkillCategoryAction = readOnly;
