import { Edit, LogOut, Moon, Sun, Unlock } from "@/src/components/Icons";
import { Logo } from "@/src/components/Logo";
import { IconSize, MENU } from "@/src/constant";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/src/ui/Button";

interface HeaderProps {
  isDark: boolean;
  onOpenPdfModal: () => void;
  onToggleTheme: () => void;
}
export const Header = ({ isDark, onToggleTheme }: HeaderProps) => {
  const { isAuthenticated, isEditMode, toggleEditMode, logout } = useAuth();

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-slate-300 bg-white/90 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:h-20 sm:gap-6 lg:h-24 lg:gap-8 lg:px-8">
        <Logo className="h-14 w-14 shrink-0" />

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          {MENU.map(
            (item) =>
              item.isVisible !== false && (
                <a
                  className="shrink-0 whitespace-nowrap transition-colors hover:text-slate-900 dark:hover:text-white"
                  href={item.href}
                  key={item.text}
                >
                  {item.text}
                </a>
              ),
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Button
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            onClick={onToggleTheme}
          >
            {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </Button>

          {isAuthenticated && (
            <>
              <Button
                className="flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all"
                onClick={toggleEditMode}
                title="Toggle edit mode"
              >
                {isEditMode ? (
                  <>
                    <Edit className={`${IconSize} text-blue-600 dark:text-blue-400`} />
                    <span>Editing Mode Active</span>
                  </>
                ) : (
                  <>
                    <Unlock className={IconSize} />
                    <span>Edit CV</span>
                  </>
                )}
              </Button>

              <Button
                aria-label="Sign out"
                className="shrink-0 rounded-lg p-2 whitespace-nowrap text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                onClick={logout}
                title="Sign out"
              >
                <LogOut className={IconSize} />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};