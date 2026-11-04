"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError, type List } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toServerTime } from "@/lib/format";
import { Field, Loading, scrollToError } from "@/components/ui";
import Companions, { type Companion } from "@/components/Companions";

type Vehicle = { id: number; model: string; plateNo: string; seatCount: number };
type Errs = Partial<Record<"vehicle" | "time" | "destination" | "passengers" | "companions" | "top", string>>;

/** 서버 안내 문구를 어느 칸에 붙일지 정해요 */
function pickField(msg: string): keyof Errs {
  if (msg.includes("목적지")) return "destination";
  if (msg.includes("동승자") || msg.includes("손님")) return "companions";
  if (msg.includes("탑승") || msg.includes("명까지") || msg.includes("좌석")) return "passengers";
  if (/시각|시작|끝나|72|3일|하루 전|30분|점검|이미|겹/.test(msg)) return "time";
  if (msg.includes("차량") || msg.includes("차를")) return "vehicle";
  return "top";
}

export default function ReservePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [destination, setDestination] = useState("");
  const [count, setCount] = useState(1);
  const [comps, setComps] = useState<Companion[]>([]);
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Vehicle[] | List<Vehicle>>("/vehicles").then((v) => setVehicles(Array.isArray(v) ? v : v.items)).catch((e) => setErrs({ top: e.message }));
  }, []);

  // 시작은 내일 00:00 이후, 끝은 시작보다 늦고 72시간 이내로만 고를 수 있어요.
  const minStart = `${new Date(Date.now() + 9 * 3600e3 + 86400e3).toISOString().slice(0, 10)}T00:00`;
  const maxEnd = startAt ? new Date(Date.parse(`${startAt}:00Z`) + 72 * 3600e3).toISOString().slice(0, 16) : undefined;
  const startTooEarly = !!startAt && startAt < minStart;
  const endNotLater = !!startAt && !!endAt && endAt <= startAt;
  const endTooLate = !!maxEnd && !!endAt && endAt > maxEnd;
  const timeErr = startTooEarly
    ? "시작은 내일 이후로 골라 주세요. 차량은 사용 하루 전까지 신청해요."
    : endNotLater ? "끝나는 시각은 시작하는 시각보다 늦어야 해요."
    : endTooLate ? "한 번에 3일(72시간)까지만 빌릴 수 있어요." : undefined;
  const vehicle = vehicles?.find((v) => String(v.id) === vehicleId);
  const need = Math.max(0, count - 1);
  const ready = !timeErr && !!vehicleId && !!startAt && !!endAt && destination.trim() && count >= 1 && comps.length === need && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErrs({});
    try {
      const r = await api<{ id: number }>("/reservations", {
        method: "POST",
        body: {
          vehicleId: Number(vehicleId), startAt: toServerTime(startAt), endAt: toServerTime(endAt),
          destination: destination.trim(), passengerCount: count,
          companions: comps.map((c) => (c.kind === "employee" ? { employeeId: c.employeeId } : { guestName: c.name, guestOrg: c.org || undefined })),
        },
      });
      router.replace(`/reservations/${r.id}`);
      return;
    } catch (x) {
      const msg = x instanceof ApiError ? x.message : "예약하지 못했어요.";
      const k = pickField(msg);
      setErrs({ [k]: msg });
      scrollToError(k === "top" ? undefined : k);
    }
    setBusy(false);
  }

  if (!vehicles) return errs.top ? <div className="alert alert-negative">{errs.top}</div> : <Loading />;

  return (
    <form className="stack" style={{ gap: 18 }} onSubmit={submit}>
      <h1>차량 예약하기</h1>
      <div className="alert alert-info">차량은 사용 하루 전까지 신청해요. 한 번에 최대 3일(72시간).</div>
      {errs.top && <div className="alert alert-negative" data-field="top">{errs.top}</div>}

      <Field name="vehicle" label="차량" error={errs.vehicle}>
        <select className={`select ${errs.vehicle ? "error" : ""}`} value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setErrs({}); }}>
          <option value="">차량을 골라 주세요</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.model} · {v.plateNo} ({v.seatCount}인승)</option>)}
        </select>
      </Field>

      <Field name="time" label="사용 시간" error={errs.time || timeErr}>
        <div className="stack" style={{ gap: 8 }}>
          <div className="stack" style={{ gap: 4 }}><span className="sub">시작</span>
            <input className={`input ${errs.time || startTooEarly ? "error" : ""}`} type="datetime-local" step={60} min={minStart} value={startAt} onChange={(e) => { const v = e.target.value; setStartAt(v); if (endAt && v && endAt <= v) setEndAt(""); setErrs({}); }} /></div>
          <div className="stack" style={{ gap: 4 }}><span className="sub">끝</span>
            <input className={`input ${errs.time || endNotLater || endTooLate ? "error" : ""}`} type="datetime-local" step={60} min={startAt || minStart} max={maxEnd} value={endAt} onChange={(e) => { setEndAt(e.target.value); setErrs({}); }} /></div>
        </div>
      </Field>

      <Field name="destination" label="목적지" error={errs.destination}>
        <input className={`input ${errs.destination ? "error" : ""}`} value={destination} onChange={(e) => { setDestination(e.target.value); setErrs({}); }} placeholder="예: 부산 해운대 거래처" />
      </Field>

      <Field name="passengers" label="탑승 인원 (운전자 포함)" error={errs.passengers} help={vehicle ? `이 차는 ${vehicle.seatCount}명까지 탈 수 있어요.` : undefined}>
        <div className="row">
          <button type="button" className="btn btn-tertiary btn-sm" onClick={() => setCount(Math.max(1, count - 1))} aria-label="한 명 줄이기">-</button>
          <span className="num" style={{ minWidth: 48, textAlign: "center", fontSize: 20 }}>{count}<span className="unit">명</span></span>
          <button type="button" className="btn btn-tertiary btn-sm" onClick={() => setCount(Math.min(vehicle?.seatCount ?? 15, count + 1))} aria-label="한 명 늘리기">+</button>
        </div>
      </Field>

      {need > 0 && (
        <Companions need={need} value={comps} onChange={(c) => { setComps(c); setErrs({}); }} selfEmployeeId={user?.employeeId ?? null} error={errs.companions} />
      )}

      <button className={`btn btn-block ${busy ? "is-loading" : ""}`} disabled={!ready}>{busy ? "처리 중" : "예약하기"}</button>
      {!ready && !busy && <p className="help" style={{ textAlign: "center" }}>
        {need > 0 && comps.length !== need ? `동승자를 ${need}명 골라 주세요.` : "빈 칸을 모두 채워 주세요."}
      </p>}
    </form>
  );
}
