"use client";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { num, todayStr } from "@/lib/format";
import { Field, Modal } from "./ui";

/** 도착 입력: 500km 넘으면 경고 후 한 번 더 확인 */
export function ReturnModal({ id, startOdometer, onClose, onDone }: { id: number; startOdometer: number | null; onClose: () => void; onDone: () => void }) {
  const [v, setV] = useState("");
  const [err, setErr] = useState("");
  const [warn, setWarn] = useState("");
  const [busy, setBusy] = useState(false);
  const n = Number(v);
  const valid = v !== "" && Number.isFinite(n) && n > 0;

  async function send(acknowledge: boolean) {
    setBusy(true); setErr("");
    try {
      await api(`/reservations/${id}/return`, { method: "POST", body: { endOdometer: n, ...(acknowledge ? { acknowledge: true } : {}) } });
      onDone();
      return;
    } catch (x) {
      if (x instanceof ApiError && x.code === "DISTANCE_WARNING") setWarn(x.message);
      else setErr(x instanceof ApiError ? x.message : "저장하지 못했어요.");
    }
    setBusy(false);
  }

  return (
    <Modal title="도착 입력" onClose={onClose}>
      {startOdometer != null && <div className="body3">출발 거리 <span className="num">{num(startOdometer)}</span><span className="unit">km</span></div>}
      <Field label="도착 주행거리 (km)" error={err}>
        <input className={`input ${err ? "error" : ""}`} inputMode="numeric" value={v} onChange={(e) => { setV(e.target.value.replace(/[^\d]/g, "")); setWarn(""); setErr(""); }} placeholder="계기판 숫자를 적어 주세요" />
      </Field>
      {warn && <div className="alert alert-caution"><div><b>{warn}</b><br />숫자가 맞는지 한 번 더 확인해 주세요.</div></div>}
      <div className="actions">
        <button className="btn btn-tertiary" onClick={onClose} disabled={busy}>닫기</button>
        {warn
          ? <button className={`btn ${busy ? "is-loading" : ""}`} onClick={() => send(true)}>{busy ? "처리 중" : "맞아요, 그대로 입력"}</button>
          : <button className={`btn ${busy ? "is-loading" : ""}`} disabled={!valid} onClick={() => send(false)}>{busy ? "처리 중" : "도착 입력"}</button>}
      </div>
    </Modal>
  );
}

export function FuelModal({ id, onClose, onDone }: { id: number; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [liters, setLiters] = useState("");
  const [date, setDate] = useState(todayStr());
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const a = Number(amount), l = Number(liters);
  const valid = a > 0 && l > 0 && !!date;

  async function send() {
    setBusy(true); setErr("");
    try {
      await api(`/reservations/${id}/fuel`, { method: "POST", body: { fueledOn: date, amount: a, liters: l } });
      onDone();
      return;
    } catch (x) { setErr(x instanceof ApiError ? x.message : "저장하지 못했어요."); }
    setBusy(false);
  }

  return (
    <Modal title="주유 기록 추가" onClose={onClose}>
      <Field label="주유한 날짜"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="금액 (원)"><input className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} placeholder="예: 72000" /></Field>
      <Field label="주유량 (리터)"><input className="input" inputMode="decimal" value={liters} onChange={(e) => setLiters(e.target.value.replace(/[^\d.]/g, ""))} placeholder="예: 38.5" /></Field>
      {err && <div className="field-error">{err}</div>}
      <div className="actions">
        <button className="btn btn-tertiary" onClick={onClose} disabled={busy}>닫기</button>
        <button className={`btn ${busy ? "is-loading" : ""}`} disabled={!valid} onClick={send}>{busy ? "처리 중" : "저장"}</button>
      </div>
    </Modal>
  );
}
