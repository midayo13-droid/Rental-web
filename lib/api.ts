export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const KEY = "nuri_token";

export function getToken(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function setToken(t: string | null) {
  try { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); } catch { /* 저장소를 못 쓰는 환경 */ }
}

export class ApiError extends Error {
  status: number;
  code?: string;
  data: any;
  constructor(status: number, message: string, code?: string, data?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

type Handlers = { onUnauthorized?: () => void; onMustChange?: () => void };
export const handlers: Handlers = {};

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, "서버에 연결할 수 없어요. 잠시 뒤에 다시 해 주세요.");
  }
  let data: any = null;
  const text = await res.text();
  if (text) { try { data = JSON.parse(text); } catch { data = null; } }
  if (!res.ok) {
    const msg = (data && typeof data.message === "string" ? data.message : Array.isArray(data?.message) ? data.message.join(" ") : "") || "문제가 생겼어요. 잠시 뒤에 다시 해 주세요.";
    if (res.status === 401 && auth) handlers.onUnauthorized?.();
    if (res.status === 403 && data?.code === "MUST_CHANGE_PASSWORD") handlers.onMustChange?.();
    throw new ApiError(res.status, msg, data?.code, data);
  }
  return data as T;
}

export type List<T> = { items: T[]; total: number; page?: number; size?: number };
