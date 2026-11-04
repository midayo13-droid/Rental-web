"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth, type User } from "@/lib/auth";
import { Field, scrollToError } from "@/components/ui";
import PasswordInput from "@/components/PasswordInput";

type Errs = Partial<Record<"employeeNo" | "name" | "email" | "password" | "top", string>>;

function pickField(msg: string): keyof Errs {
  if (msg.includes("사번") && !msg.includes("달라요")) return "employeeNo";
  if (msg.includes("이메일")) return "email";
  if (msg.includes("비밀번호")) return "password";
  if (msg.includes("이름") && !msg.includes("달라요")) return "name";
  if (msg.includes("이미 가입된 직원")) return "employeeNo";
  return "top";
}

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [f, setF] = useState({ employeeNo: "", name: "", email: "", password: "", password2: "" });
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const short = f.password.length > 0 && f.password.length < 8;
  const mismatch = f.password2.length > 0 && f.password !== f.password2;
  const ready = f.employeeNo.trim() && f.name.trim() && f.email.trim() && f.password.length >= 8 && f.password === f.password2;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErrs({});
    try {
      const r = await api<{ token: string; user: User }>("/auth/signup", {
        method: "POST", auth: false,
        body: { employeeNo: f.employeeNo.trim(), name: f.name.trim(), email: f.email.trim(), password: f.password },
      });
      login(r.token, r.user);
      router.replace("/");
    } catch (x) {
      const msg = x instanceof ApiError ? x.message : "가입하지 못했어요.";
      const k = pickField(msg);
      setErrs({ [k]: msg });
      scrollToError(k === "top" ? undefined : k);
    }
    setBusy(false);
  }

  return (
    <form className="stack" style={{ gap: 18 }} onSubmit={submit}>
      <div>
        <h1>회원가입</h1>
        <p className="sub" style={{ marginTop: 4 }}>직원 명부의 사번과 이름으로 본인을 확인해요.</p>
      </div>
      {errs.top && <div className="alert alert-negative">{errs.top}</div>}
      <Field name="employeeNo" label="사번" error={errs.employeeNo}><input className={`input ${errs.employeeNo ? "error" : ""}`} value={f.employeeNo} onChange={set("employeeNo")} placeholder="예: E010" /></Field>
      <Field name="name" label="이름" error={errs.name}><input className={`input ${errs.name ? "error" : ""}`} value={f.name} onChange={set("name")} /></Field>
      <Field name="email" label="이메일" error={errs.email}><input className={`input ${errs.email ? "error" : ""}`} type="email" value={f.email} onChange={set("email")} autoComplete="username" /></Field>
      <Field name="password" label="비밀번호" error={errs.password || (short ? "비밀번호는 8자 이상이어야 해요." : undefined)} help="8자 이상으로 적어 주세요.">
        <PasswordInput className={errs.password || short ? "error" : ""} value={f.password} onChange={set("password")} autoComplete="new-password" />
      </Field>
      <Field name="password2" label="비밀번호 확인" error={mismatch ? "비밀번호가 서로 달라요. 다시 확인해 주세요." : undefined} help="같은 비밀번호를 한 번 더 적어 주세요.">
        <PasswordInput className={mismatch ? "error" : ""} value={f.password2} onChange={set("password2")} autoComplete="new-password" />
      </Field>
      <button className={`btn btn-block ${busy ? "is-loading" : ""}`} disabled={!ready}>{busy ? "처리 중" : "가입하기"}</button>
      <div className="row" style={{ justifyContent: "center" }}>
        <span className="sub">이미 계정이 있나요?</span>
        <Link href="/login" className="textbtn">로그인</Link>
      </div>
    </form>
  );
}
