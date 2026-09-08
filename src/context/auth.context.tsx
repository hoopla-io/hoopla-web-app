import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import {
  AuthApi,
  LoginResponse,
  type OTPChannel,
} from "@/api/domains/auth";
import { AUTH_EXPIRED_EVENT } from "@/api/http-client";
import { DEFAULT_USER_NAME } from "@/helpers/utils";
import {
  setTokens,
  setAccessOnlyToken,
  clearTokens,
  hydrateTokens,
  getAccessToken,
  getRefreshToken,
} from "@/helpers/token-storage";
import { captureEightLaunch, isEightHost, clearEightSession } from "@/helpers/eight";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  pending: boolean;
}

interface AuthContextType extends AuthState {
  login: (phoneNumber: string, channel: OTPChannel) => Promise<LoginResponse>;
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
  const { t } = useTranslation();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    pending: true,
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const login = async (phoneNumber: string, channel: OTPChannel) => {
    const response = await AuthApi.login(phoneNumber, channel);

    return response;
  };

  const confirmCode = async (sessionId: string, code: number) => {
    const data = await AuthApi.confirmSms(sessionId, code);

    setTokens(data.jwt.accessToken, data.jwt.refreshToken);

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
    clearTokens();
    // Drop the host-session flag too, or the next ordinary sign-in in this
    // browser is still treated as an Eight session and never offered the
    // sign-in drawer when its token expires.
    clearEightSession();
    setState({
      isAuthenticated: false,
      isLoading: false,
      pending: false,
    });
  };

  const openLoginModal = (onSuccess?: () => void) => {
    // Inside a host app there is nothing useful behind this drawer: an SMS
    // sign-in would mint an ordinary session, which pays through Rahmat and
    // navigates the customer out of the host's WebView mid-checkout. Every
    // caller (ProtectedRoute included) funnels through here, so the guard
    // belongs here rather than at each call site.
    if (isEightHost()) {
      toast.error(t("auth.sessionExpired"));
      return;
    }
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
    let cancelled = false;

    // Hydrate from the durable store first (CloudStorage in Telegram, where
    // localStorage may have been evicted), then settle the auth state. Stays
    // `pending` until this resolves so we never flash signed-out on cold start.
    (async () => {
      // An Eight launch carries its session token on the URL and must be
      // captured before we decide anything about auth — the host already did
      // the login server-side, so there is no signed-out state to fall back to.
      // Awaited: capture waits for the host bridge to confirm we're genuinely
      // inside its WebView, and a request must not fire before it settles.
      await captureEightLaunch(setAccessOnlyToken);
      if (cancelled) return;

      await hydrateTokens();
      if (cancelled) return;
      // A host-platform session has no refresh token by design, so requiring
      // both would read every Eight customer as signed out.
      const authed = isEightHost()
        ? Boolean(getAccessToken())
        : Boolean(getAccessToken() && getRefreshToken());
      setState({
        isAuthenticated: authed,
        isLoading: false,
        pending: false,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Session expired/invalid (from the HTTP interceptor): clear auth and prompt
  // sign-in via the drawer instead of redirecting to a separate page.
  useEffect(() => {
    const handler = () => {
      pendingAction.current = null;
      setState({ isAuthenticated: false, isLoading: false, pending: false });
      // Close the edit-profile drawer first so the two never stack.
      setIsEditProfileOpen(false);

      // A host-platform session can't be renewed from here — it has no refresh
      // token, and the host issued it by calling our /login itself. Offering an
      // SMS sign-in would build a normal session that then pays through Rahmat,
      // navigating the customer out of the host's WebView mid-checkout. Tell
      // them to relaunch instead, which re-runs the host's own login.
      if (isEightHost()) {
        toast.error(t("auth.sessionExpired"));
        return;
      }

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
