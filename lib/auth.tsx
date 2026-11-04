"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, handlers, setToken } from "./api";

export type User = {
  id: number; email: string; role: "고객" | "일반 직원" | "관리자"; mustChangePassword: boolean;
  employeeId: number | null; employeeNo: string | null; name: string | null;
  departmentId: number | null; departmentName: string | null;
  licenseStatus: "미등록" | "승인 대기" | "승인" | null; licenseExpiry: string | null;
};

type Ctx = {
  user: User | null; ready: boolean; mustChange: boolean; expired: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refresh: () => Promise<void>;
  clearMustChange: () => Promise<void>;
  clearExpired: () => void;
};
const AuthCtx = createContext<Ctx>(null as unknown as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [expired, setExpired] = useState(false);

  const logout = useCallback(() => { setToken(null); setUser(null); setMustChange(false); }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setReady(true); return; }
    try {
      const u = await api<User>("/auth/me");
      setUser(u);
      setMustChange(!!u.mustChangePassword);
    } catch (e: any) {
      if (e?.status === 403 && e?.code === "MUST_CHANGE_PASSWORD") setMustChange(true);
    } finally { setReady(true); }
  }, []);

  useEffect(() => {
    handlers.onUnauthorized = () => { setToken(null); setUser(null); setMustChange(false); setExpired(true); };
    handlers.onMustChange = () => setMustChange(true);
    refresh();
  }, [refresh]);

  const login = (token: string, u: User) => {
    setToken(token); setUser(u); setExpired(false); setMustChange(!!u.mustChangePassword); setReady(true);
  };
  const clearMustChange = async () => { setMustChange(false); await refresh(); };

  return (
    <AuthCtx.Provider value={{ user, ready, mustChange, expired, login, logout, refresh, clearMustChange, clearExpired: () => setExpired(false) }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const isStaff = (u: User | null) => !!u && u.role !== "고객";
