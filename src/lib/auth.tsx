"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  apiJson,
  getToken,
  setToken,
  type AuthResponse,
  type User,
} from "@/lib/api";

export interface LoginInput {
  mode: "sms" | "password";
  phone?: string;
  code?: string;
  account?: string;
  password?: string;
}

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (input: LoginInput) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setReady(true);
      return;
    }
    apiJson<User>("/auth/me")
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const response: AuthResponse =
      input.mode === "sms"
        ? await apiJson<AuthResponse>("/auth/sms/login", {
            method: "POST",
            body: JSON.stringify({ phone: input.phone, code: input.code }),
          })
        : await apiJson<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({
              account: input.account,
              password: input.password,
            }),
          });
    setToken(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiJson("/auth/logout", { method: "POST" });
    } catch {
      // Token already invalid or backend unreachable: clear locally anyway.
    }
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
