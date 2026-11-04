"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { Field, useToast } from "@/components/ui";
import PasswordForm from "@/components/PasswordForm";

export default function MePage() {
  const { user, refresh, logout } = useAuth();
  const router = useRouter();
  const [expiry, setExpiry] = useState(user?.licenseExpiry?.slice(0, 10) || "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast, show } = useToast();
  if (!user) return null;

  const st = user.licenseStatus || "미등록";
  const chip = st === "승인" ? "chip-positive" : st === "승인 대기" ? "chip-caution" : "chip-gray";

  async function saveLicense(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api("/employees/me/license", { method: "PATCH", body: { expiry } });
      await refresh();
      show("면허 만료일을 저장했어요. 총무팀 승인을 기다려 주세요.");
    } catch (x) { setErr(x instanceof ApiError ? x.message : "저장하지 못했어요."); }
    setBusy(false);
  }

  return (
    <>
      <h1>내 정보</h1>
      <div className="card stack" style={{ gap: 8 }}>
        <div className="between"><span className="sub">이름</span><span className="body3 num">{user.name}</span></div>
        <div className="between"><span className="sub">부서</span><span className="body3">{user.departmentName}</span></div>
        <div className="between"><span className="sub">사번</span><span className="body3">{user.employeeNo}</span></div>
        <div className="between"><span className="sub">이메일</span><span className="body3">{user.email}</span></div>
      </div>

      <form className="card stack" onSubmit={saveLicense}>
        <div className="between"><span className="card-title">운전면허</span><span className={`chip ${chip}`}>{st}</span></div>
        {st === "승인" && <div className="alert alert-positive">승인됐어요. 만료일은 {user.licenseExpiry ? fmtDate(user.licenseExpiry) : "-"}이에요.</div>}
        {st !== "승인" && <div className="alert alert-caution">승인되기 전에는 차량을 예약할 수 없어요.</div>}
        <Field label="면허 만료일" error={err} help="만료일을 바꾸면 다시 승인 대기가 돼요.">
          <input className={`input ${err ? "error" : ""}`} type="date" value={expiry} onChange={(e) => { setExpiry(e.target.value); setErr(""); }} />
        </Field>
        <button className={`btn btn-secondary btn-block ${busy ? "is-loading" : ""}`} disabled={!expiry}>{busy ? "처리 중" : "만료일 저장"}</button>
      </form>

      <div className="card stack">
        <span className="card-title">비밀번호 바꾸기</span>
        <PasswordForm onDone={() => show("비밀번호를 바꿨어요.")} />
      </div>

      <button className="btn btn-tertiary btn-block" onClick={() => { logout(); router.replace("/login"); }}>로그아웃</button>
      {toast}
    </>
  );
}
