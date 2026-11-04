"use client";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Field } from "./ui";
import PasswordInput from "./PasswordInput";

export default function PasswordForm({ onDone, forced }: { onDone: () => void; forced?: boolean }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const short = next.length > 0 && next.length < 8;
  const mismatch = again.length > 0 && next !== again;
  const ready = cur && next.length >= 8 && next === again && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api("/auth/change-password", { method: "POST", body: { currentPassword: cur, newPassword: next } });
      setCur(""); setNext(""); setAgain("");
      onDone();
    } catch (x) { setErr(x instanceof ApiError ? x.message : "바꾸지 못했어요."); }
    setBusy(false);
  }
  return (
    <form className="stack" onSubmit={submit}>
      {forced && <div className="alert alert-caution">임시 비밀번호로 들어오셨어요. 새 비밀번호로 바꿔야 다른 화면을 쓸 수 있어요.</div>}
      <Field label={forced ? "임시 비밀번호" : "지금 비밀번호"}>
        <PasswordInput value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
      </Field>
      <Field label="새 비밀번호" error={short ? "비밀번호는 8자 이상이어야 해요." : undefined} help="8자 이상으로 적어 주세요.">
        <PasswordInput className={short ? "error" : ""} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
      </Field>
      <Field label="새 비밀번호 확인" error={mismatch ? "비밀번호가 서로 달라요. 다시 확인해 주세요." : undefined}>
        <PasswordInput className={mismatch ? "error" : ""} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
      </Field>
      {err && <div className="field-error">{err}</div>}
      <button className={`btn btn-block ${busy ? "is-loading" : ""}`} disabled={!ready}>{busy ? "처리 중" : "비밀번호 바꾸기"}</button>
    </form>
  );
}
