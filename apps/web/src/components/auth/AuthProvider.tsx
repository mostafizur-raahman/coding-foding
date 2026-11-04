"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import {
  accessExpiresAt,
  clearSession,
  refreshSession,
  setSession,
  type AuthResponse,
  type User,
} from "@/lib/auth/session";

export type SignupInput = {
  signup_token: string;
  display_name: string;
  phone: string; // optional: "" when not given
  district: string;
  interests: string[];
  journey_stage: string;
  password: string;
  locale: "en" | "bn";
};

type AuthState = {
  /** "loading" until the first refresh attempt settles, so UI doesn't flash "signed out". */
  status: "loading" | "authenticated" | "anonymous";
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  /** Signup step 1: emails a 6-digit code that proves the address. */
  sendCode: (email: string, locale: "en" | "bn") => Promise<void>;
  /** Signup step 2: returns the signup token (throws email_taken for a registered email). */
  verifyCode: (email: string, code: string) => Promise<string>;
  completeSignup: (input: SignupInput) => Promise<User>;
  requestReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-reads /me, e.g. after verifying the email in another tab. */
  reload: () => Promise<void>;
  /** Adopts a fresh copy of the user returned by an API call (e.g. after an avatar upload). */
  updateUser: (u: User) => void;
};

const AuthContext = createContext<AuthState | null>(null);

/** Refresh this long before the access token expires. */
const REFRESH_EARLY_MS = 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const adopt = useCallback((res: AuthResponse | null) => {
    clearTimeout(timer.current);
    if (!res) {
      clearSession();
      setUser(null);
      setStatus("anonymous");
      return null;
    }
    setSession(res);
    setUser(res.user);
    setStatus("authenticated");
    // Keep the access token fresh while the tab is open.
    const wait = Math.max(
      5_000,
      accessExpiresAt() - Date.now() - REFRESH_EARLY_MS,
    );
    timer.current = setTimeout(() => {
      refreshSession()
        .catch(() => null)
        .then(adopt);
    }, wait);
    return res.user;
  }, []);

  // Restore the session from the refresh cookie on load.
  useEffect(() => {
    refreshSession()
      .catch(() => null) // API unreachable: treat as signed out
      .then(adopt);
    return () => clearTimeout(timer.current);
  }, [adopt]);

  const sendCode = useCallback(async (email: string, locale: "en" | "bn") => {
    await apiFetch<void>("/auth/email/start", {
      method: "POST",
      body: { email, locale },
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string) =>
      adopt(
        await apiFetch<AuthResponse>("/auth/login", {
          method: "POST",
          body: { email, password },
        }),
      )!,
    [adopt],
  );

  const verifyCode = useCallback(async (email: string, code: string) => {
    const res = await apiFetch<{ signup_token: string }>("/auth/email/verify", {
      method: "POST",
      body: { email, code },
    });
    return res.signup_token;
  }, []);

  const requestReset = useCallback(async (email: string) => {
    await apiFetch<void>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await apiFetch<void>("/auth/reset-password", {
      method: "POST",
      body: { token, password },
    });
  }, []);

  const completeSignup = useCallback(
    async (input: SignupInput) =>
      adopt(
        await apiFetch<AuthResponse>("/auth/email/signup", {
          method: "POST",
          body: input,
        }),
      )!,
    [adopt],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch<void>("/auth/logout", { method: "POST" });
    } finally {
      adopt(null);
    }
  }, [adopt]);

  const reload = useCallback(async () => {
    setUser(await apiFetch<User>("/me"));
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      login,
      sendCode,
      verifyCode,
      completeSignup,
      requestReset,
      resetPassword,
      logout,
      reload,
      updateUser: setUser,
    }),
    [
      status,
      user,
      login,
      sendCode,
      verifyCode,
      completeSignup,
      requestReset,
      resetPassword,
      logout,
      reload,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
