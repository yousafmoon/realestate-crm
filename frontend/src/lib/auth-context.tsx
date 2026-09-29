"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getCurrentUser, login as apiLogin, TOKEN_KEY } from "@/lib/api";
import type { CurrentUser } from "@/lib/types";

interface AuthContextValue {
  user: CurrentUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const clearSession = () => {
      window.localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setReady(true);
    };
    window.addEventListener("crm:unauthorized", clearSession);

    async function initialize() {
      await Promise.resolve();
      if (!active) return;
      if (!window.localStorage.getItem(TOKEN_KEY)) {
        setReady(true);
        return;
      }
      try {
        setUser(await getCurrentUser());
      } catch {
        clearSession();
      } finally {
        if (active) setReady(true);
      }
    }

    void initialize();

    return () => {
      active = false;
      window.removeEventListener("crm:unauthorized", clearSession);
    };
  }, []);

  async function login(email: string, password: string) {
    const response = await apiLogin(email, password);
    window.localStorage.setItem(TOKEN_KEY, response.access_token);
    try {
      setUser(await getCurrentUser());
    } catch (error) {
      window.localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      throw error;
    }
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
