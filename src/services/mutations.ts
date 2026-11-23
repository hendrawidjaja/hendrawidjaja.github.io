/**
 * Mutation entry points used by the editor. Normal builds get the server
 * actions; `scripts/build-github-pages.sh` swaps this file for read-only stubs
 * because static export cannot contain server actions.
 */
export {
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
} from "@/src/app/actions";
