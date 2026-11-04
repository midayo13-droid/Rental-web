"use client";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type List } from "@/lib/api";
import { CLAIM_CHIP, fmtDate, num, todayStr } from "@/lib/format";
import { Confirm, Field, Loading, scrollToError, useToast } from "@/components/ui";

type Claim = {
  id: number; travelDate: string; destination: string; distanceKm: number; ratePerKm: number; amount: number;
  status: string; rejectReason: string | null;
};
type Errs = Partial<Record<"date" | "dest" | "km" | "top", string>>;
const RATE = 200;

function pickField(msg: string): keyof Errs {
  if (msg.includes("목적지")) return "dest";
  if (msg.includes("거리") || msg.includes("km")) return "km";
  if (msg.includes("이용일") || msg.includes("날짜") || msg.includes("30일")) return "date";
  return "top";
}

export default function ClaimsPage() {
  const [date, setDate] = useState("");
  const [dest, setDest] = useState("");
  const [km, setKm] = useState("");
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  const [list, setList] = useState<Claim[] | null>(null);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [listErr, setListErr] = useState("");
  const { toast, show } = useToast();

  const load = useCallback(() => {
    api<List<Claim>>("/claims?mine=1&size=100").then((r) => setList(r.items)).catch((e) => setListErr(e.message));
  }, []);
  useEffect(load, [load]);

  const n = Number(km);
  const validKm = km !== "" && Number.isInteger(n) && n >= 1;
  const amount = validKm ? n * RATE : 0;
  const ready = !!date && dest.trim() && validKm && !busy;

  async function send(acknowledge: boolean) {
    setBusy(true); setErrs({}); setAsk(false);
    try {
      await api("/claims", { method: "POST", body: { travelDate: date, destination: dest.trim(), distanceKm: n, ...(acknowledge ? { acknowledge: true } : {}) } });
      setDate(""); setDest(""); setKm("");
      show("정산을 신청했어요.");
      load();
    } catch (x) {
      if (x instanceof ApiError && x.code === "DISTANCE_WARNING") setAsk(true);
      else {
        const msg = x instanceof ApiError ? x.message : "신청하지 못했어요.";
        const k = pickField(msg);
        setErrs({ [k]: msg });
        scrollToError(k === "top" ? undefined : k);
      }
    }
    setBusy(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (n > 1000) setAsk(true); else send(false);
  }

  async function cancel() {
    if (cancelId == null) return;
    setBusy(true);
    try { await api(`/claims/${cancelId}/cancel`, { method: "POST" }); show("정산 신청을 취소했어요."); load(); }
    catch (x) { show(x instanceof ApiError ? x.message : "취소하지 못했어요."); }
    setCancelId(null); setBusy(false);
  }

  return (
    <>
      <h1>개인 차량 정산</h1>
      <p className="sub">개인 차량으로 출장을 다녀오면 1km당 200원을 정산해요. 영수증은 필요 없어요.</p>

      <form className="stack" onSubmit={submit}>
        {errs.top && <div className="alert alert-negative">{errs.top}</div>}
        <Field name="date" label="이용일" error={errs.date}>
          <input className={`input ${errs.date ? "error" : ""}`} type="date" max={todayStr()} value={date} onChange={(e) => { setDate(e.target.value); setErrs({}); }} />
        </Field>
        <Field name="dest" label="목적지" error={errs.dest}>
          <input className={`input ${errs.dest ? "error" : ""}`} value={dest} onChange={(e) => { setDest(e.target.value); setErrs({}); }} placeholder="예: 대전 협력사" />
        </Field>
        <Field name="km" label="왕복 거리 (km)" error={errs.km || (km !== "" && !validKm ? "거리는 1km 이상의 숫자로 적어 주세요." : undefined)}>
          <input className={`input ${errs.km ? "error" : ""}`} inputMode="numeric" value={km} onChange={(e) => { setKm(e.target.value.replace(/[^\d]/g, "")); setErrs({}); }} placeholder="예: 120" />
        </Field>

        <div className="card stack" style={{ gap: 4 }}>
          <span className="sub">정산 금액 · 거리 × {RATE}원</span>
          <div className="big-amount"><span className="num">{num(amount)}</span><span className="unit">원</span></div>
          {n > 1000 && <div className="alert alert-caution" style={{ marginTop: 8 }}>너무 멀어요. 맞는지 확인해 주세요.</div>}
        </div>

        <button className={`btn btn-block ${busy ? "is-loading" : ""}`} disabled={!ready}>{busy ? "처리 중" : "정산 신청"}</button>
      </form>

      <div className="section-title" style={{ marginTop: 8 }}><h2>내 정산 목록</h2></div>
      {listErr ? <div className="alert alert-negative">{listErr}</div>
        : !list ? <Loading />
        : list.length === 0 ? <div className="empty card">신청한 정산이 없어요.</div>
        : <div className="list">{list.map((c) => (
            <div key={c.id} className="card stack" style={{ gap: 6 }}>
              <div className="between">
                <span className="card-title">{c.destination}</span>
                <span className={`chip ${CLAIM_CHIP[c.status] || ""}`}>{c.status}</span>
              </div>
              <div className="between">
                <span className="card-meta">{fmtDate(c.travelDate)} · {num(c.distanceKm)} km</span>
                <span><span className="num" style={{ fontSize: 18 }}>{num(c.amount)}</span><span className="unit">원</span></span>
              </div>
              {c.status === "반려됨" && c.rejectReason && <div className="alert alert-negative">반려 사유: {c.rejectReason}</div>}
              {c.status === "신청됨" && <button className="btn btn-tertiary btn-sm" onClick={() => setCancelId(c.id)}>취소</button>}
            </div>))}</div>}

      {ask && <Confirm title="거리를 확인해 주세요" message={<>왕복 <b>{num(n)}km</b>는 1,000km가 넘어요. 맞는 거리인지 확인해 주세요. 총무팀이 한 번 더 살펴봐요.</>} okText="맞아요, 신청할게요" cancelText="다시 볼게요" busy={busy} onOk={() => send(true)} onCancel={() => setAsk(false)} />}
      {cancelId != null && <Confirm title="정산 신청을 취소할까요?" message="취소하면 다시 신청해야 해요." okText="신청 취소" cancelText="아니요" danger busy={busy} onOk={cancel} onCancel={() => setCancelId(null)} />}
      {toast}
    </>
  );
}
