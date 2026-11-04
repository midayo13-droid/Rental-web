const DOW = ["일", "월", "화", "수", "목", "금", "토"];

function parts(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(s || "");
  if (!m) return null;
  return { y: +m[1], mo: +m[2], d: +m[3], h: m[4] ?? "00", mi: m[5] ?? "00" };
}
function dow(p: { y: number; mo: number; d: number }) {
  return DOW[new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay()];
}

export function fmtDate(s: string) {
  const p = parts(s);
  return p ? `${p.mo}월 ${p.d}일 (${dow(p)})` : s;
}
export function fmtTime(s: string) {
  const p = parts(s);
  return p ? `${p.h}:${p.mi}` : s;
}
export function fmtDateTime(s: string) {
  const p = parts(s);
  return p ? `${p.mo}월 ${p.d}일 (${dow(p)}) ${p.h}:${p.mi}` : s;
}
export function fmtRange(a: string, b: string) {
  const pa = parts(a), pb = parts(b);
  if (!pa || !pb) return `${a} ~ ${b}`;
  if (pa.y === pb.y && pa.mo === pb.mo && pa.d === pb.d) return `${fmtDateTime(a)} ~ ${pb.h}:${pb.mi}`;
  return `${fmtDateTime(a)} ~ ${fmtDateTime(b)}`;
}
export function num(n: number | string | null | undefined) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toLocaleString("ko-KR") : "-";
}
/** 브라우저 시계 기준 오늘 (YYYY-MM-DD) */
export function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function daysUntil(dateStr: string) {
  const p = parts(dateStr), t = parts(todayStr());
  if (!p || !t) return 0;
  return Math.round((Date.UTC(p.y, p.mo - 1, p.d) - Date.UTC(t.y, t.mo - 1, t.d)) / 86400000);
}
/** datetime-local 값(YYYY-MM-DDTHH:mm) → 서버 형식 */
export function toServerTime(v: string) {
  return v.length === 16 ? `${v}:00` : v;
}

export type Status = "예약됨" | "운행 중" | "확인 대기" | "반납" | "취소";
export const STATUS_CHIP: Record<string, string> = {
  "예약됨": "chip-info", "운행 중": "chip-positive", "확인 대기": "chip-caution", "반납": "chip-gray", "취소": "chip-muted",
};
export const CLAIM_CHIP: Record<string, string> = {
  "신청됨": "chip-info", "승인됨": "chip-positive", "반려됨": "chip-negative", "취소": "chip-gray",
};
