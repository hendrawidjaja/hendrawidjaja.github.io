import { WORDING } from "@/src/constant";
import { useAuth } from "../context/AuthContext";
import { KeyRound, Lock, Unlock } from "./Icons";
import { Button } from "@/src/ui/Button";

const mutedButtonClass =
  "flex items-center gap-1 transition-colors hover:text-slate-900 dark:hover:text-white";
export const Footer = () => {
  const { isAuthenticated, openLoginModal, openPasswordModal, isEditMode, toggleEditMode } =
    useAuth();

  return (
    <footer
      className="border-t border-slate-300 bg-white py-12 transition-colors dark:border-slate-800 dark:bg-slate-950"
      id="contact"
    >
      <div className="no-print mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="order-1 flex flex-wrap items-center gap-4 text-xs text-slate-500 md:order-2 md:flex-1 dark:text-slate-400">
          <a
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
            href="#experience"
          >
            Experience
          </a>
          <span aria-hidden="true">·</span>

          <a
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
            href="#projects"
          >
            Projects
          </a>
          <span aria-hidden="true">·</span>
        </div>

        <p className="order-2 text-sm md:order-0">
          &#xA9; Copyright {new Date().getFullYear()}, {WORDING.FULLNAME}
        </p>

        <div className="order-3 flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button
                className="flex items-center gap-1 text-blue-600 hover:underline md:ml-auto dark:text-blue-400"
                onClick={toggleEditMode}
              >
                <Unlock className="h-3.5 w-3.5" />
                <span>{isEditMode ? "Exit Edit Mode" : "Edit CV"}</span>
              </Button>

              <Button
                className={mutedButtonClass}
                onClick={openPasswordModal}
                title="Change admin password"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Password</span>
              </Button>
            </>
          ) : (
            <Button className={`${mutedButtonClass} md:ml-auto`} onClick={openLoginModal}>
              <Lock className="h-3.5 w-3.5" />
            </Button>
          )}

          <a
            className="ml-4 flex shrink-0 items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            href="#top"
          >
            <span>Back to Top</span>
            <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
};