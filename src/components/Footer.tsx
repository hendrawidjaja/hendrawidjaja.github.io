import type { MouseEvent } from "react";
import { IconSize, WORDING } from "@/src/constant";
import { Button } from "@/src/ui/Button";
import { useAuth } from "../context/AuthContext";
import { KeyRound, Lock, Unlock } from "./Icons";

const mutedButtonClass =
  "flex items-center gap-1 transition-colors hover:text-slate-900 dark:hover:text-white";

/** The GitHub Pages build has no auth or API routes, so hide the editor entry point. */
const READ_ONLY = process.env.NEXT_PUBLIC_READ_ONLY === "1";

/** Injected by next.config.mjs: `0.<commit count>.0`. */
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

const handleBackToTop = (e: MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault();
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "instant",
  });
};
export const Footer = () => {
  const { isAuthenticated, openLoginModal, openPasswordModal, isEditMode, toggleEditMode } =
    useAuth();

  return (
    <footer
      className="no-print border-t border-slate-300 bg-white py-12 transition-colors dark:border-slate-800 dark:bg-slate-950"
      id="contact"
    >
      <div className="no-print mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 md:flex-row lg:px-8">
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
          {READ_ONLY ? null : isAuthenticated ? (
            <>
              <Button
                className="flex items-center gap-1 text-blue-600 hover:underline md:ml-auto dark:text-blue-400"
                onClick={toggleEditMode}
              >
                <Unlock className={IconSize} />
                <span>{isEditMode ? "Exit Edit Mode" : WORDING.EDIT_CV}</span>
              </Button>

              <Button
                className={`${mutedButtonClass} ml-4`}
                onClick={openPasswordModal}
                title={WORDING.CHANGE_PASSWORD}
              >
                <KeyRound className={IconSize} />
                <span>{WORDING.CHANGE_PASSWORD}</span>
              </Button>
            </>
          ) : (
            <Button className={`${mutedButtonClass} md:ml-auto`} onClick={openLoginModal}>
              <Lock className={IconSize} />
            </Button>
          )}

          {VERSION ? (
            <span className="ml-4 font-mono text-xs text-slate-400 dark:text-slate-500">
              v{VERSION}
            </span>
          ) : null}

          <a
            className="ml-4 flex shrink-0 items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            href="#top"
            onClick={handleBackToTop}
          >
            <span>{WORDING.BACK_TO_TOP}</span>
            <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
};