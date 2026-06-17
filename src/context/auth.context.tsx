import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { AuthApi, LoginResponse } from "@/api/domains/auth";
import { AUTH_EXPIRED_EVENT } from "@/api/http-client";
import { DEFAULT_USER_NAME } from "@/helpers/utils";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  pending: boolean;
}

interface AuthContextType extends AuthState {
  login: (phoneNumber: string) => Promise<LoginResponse>;
  confirmCode: (sessionId: string, code: number) => Promise<void>;
  logout: () => void;
  isLoginModalOpen: boolean;
  /** Open the sign-in modal; `onSuccess` runs once after a successful login. */
  openLoginModal: (onSuccess?: () => void) => void;
  closeLoginModal: () => void;
  isEditProfileOpen: boolean;
  openEditProfile: () => void;
  closeEditProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    pending: true,
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const login = async (phoneNumber: string) => {
    const response = await AuthApi.login(phoneNumber);

    return response;
  };

  const confirmCode = async (sessionId: string, code: number) => {
    const data = await AuthApi.confirmSms(sessionId, code);

    localStorage.setItem("access_token", data.jwt.accessToken);
    localStorage.setItem("refresh_token", data.jwt.refreshToken);

    setState({
      isAuthenticated: true,
      isLoading: false,
      pending: false,
    });

    // Close the modal (if open) and resume the action that required auth.
    setIsLoginModalOpen(false);
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();

    // Onboarding: if the account still has the default name, prompt the user to
    // set their profile. Fire-and-forget so login completes immediately.
    void (async () => {
      try {
        const user = await AuthApi.getUser();
        if (user?.name?.trim().toLowerCase() === DEFAULT_USER_NAME) {
          setIsEditProfileOpen(true);
        }
      } catch {
        // ignore — non-critical onboarding nudge
      }
    })();
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setState({
      isAuthenticated: false,
      isLoading: false,
      pending: false,
    });
  };

  const openLoginModal = (onSuccess?: () => void) => {
    pendingAction.current = onSuccess ?? null;
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    pendingAction.current = null;
    setIsLoginModalOpen(false);
  };

  const openEditProfile = () => setIsEditProfileOpen(true);
  const closeEditProfile = () => setIsEditProfileOpen(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (accessToken && refreshToken) {
      setState({
        isAuthenticated: true,
        isLoading: false,
        pending: false,
      });
    } else {
      setState({
        isAuthenticated: false,
        isLoading: false,
        pending: false,
      });
    }
  }, []);

  // Session expired/invalid (from the HTTP interceptor): clear auth and prompt
  // sign-in via the drawer instead of redirecting to a separate page.
  useEffect(() => {
    const handler = () => {
      pendingAction.current = null;
      setState({ isAuthenticated: false, isLoading: false, pending: false });
      // Close the edit-profile drawer first so the two never stack.
      setIsEditProfileOpen(false);
      setIsLoginModalOpen(true);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        confirmCode,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        isEditProfileOpen,
        openEditProfile,
        closeEditProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
