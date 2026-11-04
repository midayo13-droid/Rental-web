"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth, type User } from "@/lib/auth";
import { Field } from "@/components/ui";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const { user, ready, login, expired } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false); // 4초 넘게 걸리면 "서버 깨우는 중" 안내
  useEffect(() => {
    if (!busy) { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, [busy]);

  useEffect(() => { if (ready && user) router.replace("/"); }, [ready, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await api<{ token: string; user: User }>("/auth/login", { method: "POST", body: { email: email.trim(), password }, auth: false });
      login(r.token, r.user);
      router.replace("/");
    } catch (x) { setErr(x instanceof ApiError ? x.message : "로그인하지 못했어요."); }
    setBusy(false);
  }

  return (
    <form className="stack" style={{ gap: 20 }} onSubmit={submit}>
      <div>
        <h1>누리상사 법인차량</h1>
        <p className="sub" style={{ marginTop: 4 }}>로그인하고 차량을 예약해 보세요.</p>
      </div>
      {expired && <div className="alert alert-caution">로그인 시간이 끝났어요. 다시 로그인해 주세요.</div>}
      {slow && <div className="alert alert-info" role="status">서버를 깨우는 중이에요. 무료 서버라 한동안 쓰지 않으면 잠들어서, 첫 접속은 30초~1분쯤 걸릴 수 있어요. 잠시만 기다려 주세요.</div>}
      <Field label="이메일"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></Field>
      <Field label="비밀번호" error={err}>
        <PasswordInput className={err ? "error" : ""} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </Field>
      <button className={`btn btn-block ${busy ? "is-loading" : ""}`} disabled={!email.trim() || !password}>{busy ? "처리 중" : "로그인"}</button>
      <div className="row" style={{ justifyContent: "center" }}>
        <span className="sub">처음이세요?</span>
        <Link href="/signup" className="textbtn">회원가입</Link>
      </div>
    </form>
  );
}
