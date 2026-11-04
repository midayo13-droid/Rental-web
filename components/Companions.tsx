"use client";
import { useEffect, useState } from "react";
import { api, type List } from "@/lib/api";

export type Companion =
  | { kind: "employee"; employeeId: number; name: string; dept?: string }
  | { kind: "guest"; name: string; org?: string };

type Emp = { id: number; name: string; departmentName: string };

export default function Companions({ need, value, onChange, selfEmployeeId, error }: {
  need: number; value: Companion[]; onChange: (c: Companion[]) => void; selfEmployeeId: number | null; error?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Emp[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestOrg, setGuestOrg] = useState("");
  const [guestErr, setGuestErr] = useState("");

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      api<List<Emp>>(`/employees?q=${encodeURIComponent(q.trim())}&size=8`).then((r) => setResults(r.items)).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const full = value.length >= need;
  const picked = (id: number) => value.some((c) => c.kind === "employee" && c.employeeId === id);
  const candidates = results.filter((r) => r.id !== selfEmployeeId && !picked(r.id));

  function addEmp(e: Emp) {
    if (full) return;
    onChange([...value, { kind: "employee", employeeId: e.id, name: e.name, dept: e.departmentName }]);
    setQ(""); setResults([]);
  }
  function addGuest() {
    if (!guestName.trim()) { setGuestErr("손님 이름을 적어 주세요."); return; }
    if (full) return;
    onChange([...value, { kind: "guest", name: guestName.trim(), org: guestOrg.trim() || undefined }]);
    setGuestName(""); setGuestOrg(""); setGuestErr("");
  }

  return (
    <div className={`field ${error ? "has-error" : ""}`} data-field="companions">
      <label>동승자 ({value.length}/{need}명)</label>
      {value.length > 0 && (
        <div className="chips" style={{ flexWrap: "wrap" }}>
          {value.map((c, i) => (
            <button key={i} type="button" className="pick on" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`${c.name} 빼기`}>
              {c.name}{c.kind === "guest" ? ` · 외부 손님${c.org ? `(${c.org})` : ""}` : c.dept ? ` · ${c.dept}` : ""} &times;
            </button>
          ))}
        </div>
      )}
      {error && <div className="field-error">{error}</div>}
      {!full && (
        <>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="직원 이름으로 찾기" />
          {q.trim() && (candidates.length === 0
            ? <div className="help">찾는 직원이 없어요.</div>
            : <div className="search-results">{candidates.map((r) => (
                <button key={r.id} type="button" onClick={() => addEmp(r)}>{r.name} <span className="muted">· {r.departmentName}</span></button>
              ))}</div>)}
          <div className="card white stack" style={{ gap: 8 }}>
            <span className="label">외부 손님 추가</span>
            <input className={`input ${guestErr ? "error" : ""}`} value={guestName} onChange={(e) => { setGuestName(e.target.value); setGuestErr(""); }} placeholder="손님 이름 (필수)" />
            {guestErr && <div className="field-error">{guestErr}</div>}
            <input className="input" value={guestOrg} onChange={(e) => setGuestOrg(e.target.value)} placeholder="소속 (선택)" />
            <button type="button" className="btn btn-secondary btn-sm" onClick={addGuest}>손님 추가</button>
          </div>
        </>
      )}
      {full && <div className="help">동승자를 모두 골랐어요. 칩을 누르면 뺄 수 있어요.</div>}
    </div>
  );
}
