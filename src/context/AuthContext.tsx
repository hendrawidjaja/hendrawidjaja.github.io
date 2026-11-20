import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import {
  getStoredUsername,
  loginAdmin,
  logoutAdmin,
  registerAdmin,
  verifyToken,
} from "../services/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthState {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  isEditMode: boolean;
  isLoginModalOpen: boolean;
  isPasswordModalOpen: boolean;
  username: string | null;
}

interface AuthContextType {
  closeLoginModal: () => void;
  closePasswordModal: () => void;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  isEditMode: boolean;
  isLoginModalOpen: boolean;
  isPasswordModalOpen: boolean;
  login: (username: string, pass: string) => Promise<{ mustChangePassword: boolean }>;
  logout: () => Promise<void>;
  openLoginModal: () => void;
  openPasswordModal: () => void;
  register: (username: string, pass: string) => Promise<{ mustChangePassword: boolean }>;
  setEditMode: (val: boolean) => void;
  toggleEditMode: () => void;
  username: string | null;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isCheckingAuth: true,
    isEditMode: false,
    isLoginModalOpen: false,
    isPasswordModalOpen: false,
    username: null,
  });

  useEffect(() => {
    async function check() {
      try {
        const valid = await verifyToken();
        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: valid,
          username: valid ? getStoredUsername() : null,
        }));
      } catch {
        setAuthState((prev) => ({ ...prev, isAuthenticated: false }));
      } finally {
        setAuthState((prev) => ({ ...prev, isCheckingAuth: false }));
      }
    }

    check();
  }, []);

  const login = async (u: string, p: string) => {
    const res = await loginAdmin(u, p);
    const mustChangePassword = res.mustChangePassword === true;
    setAuthState((prev) => ({
      ...prev,
      isAuthenticated: true,
      username: res.user.username,
      isEditMode: !mustChangePassword,
      isLoginModalOpen: false,
      isPasswordModalOpen: mustChangePassword,
    }));
    return { mustChangePassword };
  };

  const register = async (u: string, p: string) => {
    const res = await registerAdmin(u, p);
    setAuthState((prev) => ({
      ...prev,
      isAuthenticated: true,
      username: res.user.username,
      isEditMode: true,
      isLoginModalOpen: false,
      isPasswordModalOpen: false,
    }));
    return { mustChangePassword: false };
  };

  const logout = async () => {
    await logoutAdmin();
    setAuthState((prev) => ({
      ...prev,
      isAuthenticated: false,
      username: null,
      isEditMode: false,
    }));
  };

  const toggleEditMode = () => {
    if (!authState.isAuthenticated) {
      setAuthState((prev) => ({ ...prev, isLoginModalOpen: true }));
      return;
    }
    setAuthState((prev) => ({ ...prev, isEditMode: !authState.isEditMode }));
  };

  const setEditMode = (val: boolean) => {
    if (!authState.isAuthenticated && val) {
      setAuthState((prev) => ({ ...prev, isLoginModalOpen: true }));
      return;
    }
    setAuthState((prev) => ({ ...prev, isEditMode: val }));
  };

  return (
    <AuthContext.Provider
      value={{
        closeLoginModal: () => setAuthState((prev) => ({ ...prev, isLoginModalOpen: false })),
        closePasswordModal: () => setAuthState((prev) => ({ ...prev, isPasswordModalOpen: false })),
        isAuthenticated: authState.isAuthenticated,
        isCheckingAuth: authState.isCheckingAuth,
        isEditMode: authState.isEditMode,
        isLoginModalOpen: authState.isLoginModalOpen,
        isPasswordModalOpen: authState.isPasswordModalOpen,
        login,
        logout,
        openLoginModal: () => setAuthState((prev) => ({ ...prev, isLoginModalOpen: true })),
        openPasswordModal: () => setAuthState((prev) => ({ ...prev, isPasswordModalOpen: true })),
        register,
        setEditMode,
        toggleEditMode,
        username: authState.username,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}