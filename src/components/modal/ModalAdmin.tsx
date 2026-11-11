import { useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { changeAdminPassword, registrationStatus } from "../../services/api";
import { AlertCircle, Check, KeyRound, Lock, LogOut } from "../Icons";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import { ModalShell } from "./ModalShell";

interface LoginState {
  error: string | null;
  isLoading: boolean;
  password: string;
  username: string;
}

interface PasswordState {
  confirmPass: string;
  currentPass: string;
  error: string | null;
  newPass: string;
}

interface RegisterState {
  confirmPass: string;
  error: string | null;
  password: string;
  username: string;
}

type AuthMode = "login" | "register";

export const ModalAdmin = () => {
  const {
    isAuthenticated,
    isLoginModalOpen,
    isPasswordModalOpen,
    closeLoginModal,
    closePasswordModal,
    login,
    logout,
    openLoginModal,
    register,
    username,
  } = useAuth();

  const { showToast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginState, setLoginState] = useState<LoginState>({
    error: null,
    isLoading: false,
    password: "",
    username: "admin",
  });
  const [registerState, setRegisterState] = useState<RegisterState>({
    confirmPass: "",
    error: null,
    password: "",
    username: "",
  });
  const [passState, setPassState] = useState<PasswordState>({
    confirmPass: "",
    currentPass: "",
    error: null,
    newPass: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Registration is only offered while the user store exists and is empty.
  useEffect(() => {
    if (!isLoginModalOpen || isAuthenticated) {
      setMode("login");
      return;
    }
    let active = true;
    registrationStatus()
      .then((status) => {
        if (active) setRegisterOpen(status.open);
      })
      .catch(() => {
        if (active) setRegisterOpen(false);
      });
    return () => {
      active = false;
    };
  }, [isLoginModalOpen, isAuthenticated]);

  if (!isLoginModalOpen && !isPasswordModalOpen) {
    return null;
  }

  const handleLoginSubmit = async () => {
    setLoginState((prev) => ({ ...prev, error: null }));
    setIsLoading(true);
    try {
      const result = await login(loginState.username, loginState.password);
      if (result.mustChangePassword) {
        showToast("Default password in use — set a new password to unlock editing.", "info");
      } else {
        showToast("Authenticated as Admin. Edit Mode is now enabled!", "success");
      }
      setLoginState((prev) => ({ ...prev, password: "" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      setLoginState((prev) => ({ ...prev, error: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    setRegisterState((prev) => ({ ...prev, error: null }));
    if (registerState.password !== registerState.confirmPass) {
      setRegisterState((prev) => ({ ...prev, error: "Passwords do not match" }));
      return;
    }
    if (registerState.password.length < 12) {
      setRegisterState((prev) => ({ ...prev, error: "Password must be at least 12 characters" }));
      return;
    }

    setIsLoading(true);
    try {
      await register(registerState.username.trim(), registerState.password);
      showToast(
        `Account "${registerState.username.trim()}" created. Edit Mode enabled.`,
        "success",
      );
      setRegisterState({ username: "", password: "", confirmPass: "", error: null });
      setMode("login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setRegisterState((prev) => ({ ...prev, error: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setPassState((prev) => ({ ...prev, error: null }));
    if (passState.newPass !== passState.confirmPass) {
      setPassState((prev) => ({ ...prev, error: "New passwords do not match" }));
      return;
    }

    if (passState.newPass.length < 12) {
      setPassState((prev) => ({ ...prev, error: "Password must be at least 12 characters" }));
      return;
    }

    setIsLoading(true);
    try {
      await changeAdminPassword(passState.currentPass, passState.newPass);
      // The server revokes every token when the password changes.
      await logout();
      showToast("Password changed. Please sign in with your new password.", "success");
      setPassState({ currentPass: "", newPass: "", confirmPass: "", error: null });
      closePasswordModal();
      openLoginModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password";
      setPassState((prev) => ({ ...prev, error: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  const close = isLoginModalOpen ? closeLoginModal : closePasswordModal;
  const isRegisterMode = isLoginModalOpen && mode === "register";

  const headerChildren = (
    <div className="flex items-center gap-2.5">
      <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
        {isLoginModalOpen ? <Lock className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {isRegisterMode
            ? "Create Admin Account"
            : isLoginModalOpen
              ? "Admin Authentication"
              : "Change Admin Password"}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isRegisterMode
            ? "First account setup — registration closes once a user exists"
            : isLoginModalOpen
              ? "Sign in to edit, add, or remove CV content"
              : "Update credentials for CV management"}
        </p>
      </div>
    </div>
  );

  return (
    <ModalShell
      headerChildren={headerChildren}
      innerClassName="overflow-hidden"
      isOpen={isLoginModalOpen || isPasswordModalOpen}
      maxW="md"
      onClose={close}
    >
      {isLoginModalOpen && (
        <div className="p-6">
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 sm:text-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  You are currently authenticated as <strong>{username ?? "admin"}</strong>.
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60"
                  onClick={async () => {
                    await logout();
                    showToast("Logged out successfully", "info");
                    closeLoginModal();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>

                <Button
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  onClick={closeLoginModal}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : isRegisterMode ? (
            <form action={handleRegisterSubmit} className="space-y-4">
              {registerState.error && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{registerState.error}</span>
                </div>
              )}

              <TextField
                autoComplete="username"
                label="Username"
                onChange={(value) => setRegisterState((prev) => ({ ...prev, username: value }))}
                placeholder="e.g. hendra"
                required
                type="text"
                value={registerState.username}
              />

              <TextField
                autoComplete="new-password"
                label="Password (minimum 12 characters)"
                onChange={(value) => setRegisterState((prev) => ({ ...prev, password: value }))}
                required
                type="password"
                value={registerState.password}
              />

              <TextField
                autoComplete="new-password"
                label="Confirm Password"
                onChange={(value) => setRegisterState((prev) => ({ ...prev, confirmPass: value }))}
                required
                type="password"
                value={registerState.confirmPass}
              />

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  onClick={() => setMode("login")}
                >
                  Back to sign in
                </Button>

                <Button
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </form>
          ) : (
            <form action={handleLoginSubmit} className="space-y-4">
              {loginState.error && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{loginState.error}</span>
                </div>
              )}

              <TextField
                autoComplete="username"
                label="Username"
                onChange={(value) => setLoginState((prev) => ({ ...prev, username: value }))}
                required
                type="text"
                value={loginState.username}
              />

              <TextField
                autoComplete="current-password"
                label="Password"
                onChange={(password) => setLoginState((prev) => ({ ...prev, password }))}
                placeholder="Enter admin password"
                required
                type="password"
                value={loginState.password}
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  onClick={closeLoginModal}
                >
                  Cancel
                </Button>

                <Button
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? "Authenticating..." : "Sign In"}
                </Button>
              </div>

              {registerOpen && (
                <p className="pt-1 text-center text-xs text-slate-500 dark:text-slate-400">
                  First time here?{" "}
                  <Button
                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    onClick={() => setMode("register")}
                  >
                    Create admin account
                  </Button>
                </p>
              )}
            </form>
          )}
        </div>
      )}

      {isPasswordModalOpen && (
        <form action={handlePasswordSubmit} className="space-y-4 p-6">
          {passState.error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passState.error}</span>
            </div>
          )}

          <TextField
            autoComplete="current-password"
            label="Current Password"
            onChange={(currentPass) => setPassState((prev) => ({ ...prev, currentPass }))}
            required
            type="password"
            value={passState.currentPass}
          />

          <TextField
            autoComplete="new-password"
            label="New Password (minimum 12 characters)"
            onChange={(newPass) => setPassState((prev) => ({ ...prev, newPass }))}
            required
            type="password"
            value={passState.newPass}
          />

          <TextField
            autoComplete="new-password"
            label="Confirm New Password"
            onChange={(confirmPass) => setPassState((prev) => ({ ...prev, confirmPass }))}
            required
            type="password"
            value={passState.confirmPass}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              onClick={closePasswordModal}
            >
              Cancel
            </Button>

            <Button
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Updating..." : "Save New Password"}
            </Button>
          </div>
        </form>
      )}
    </ModalShell>
  );
};