"use client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { fmtDateTime, fmtTime, fmtDate, num, type Status } from "@/lib/format";
import { BackButton, Confirm, Loading, StatusChip, useToast } from "@/components/ui";
import { FuelModal, ReturnModal } from "@/components/TripModals";
import type { Reservation } from "@/components/ReservationCard";

type Detail = Reservation & {
  isMine: boolean;
  trip: { startOdometer: number; departedAt: string; endOdometer: number | null; confirmedAt: string | null; confirmedByName: string | null } | null;
  companions: { id: number; name: string; guestOrg: string | null; isGuest: boolean; departmentName: string | null }[];
  fuel: { id: number; fueledOn: string; amount: number; liters: number; receiptSubmitted: boolean }[];
};

const STEPS: Status[] = ["예약됨", "운행 중", "확인 대기", "반납"];

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState<"" | "depart" | "cancel" | "return" | "fuel">("");
  const [busy, setBusy] = useState(false);
  const [actErr, setActErr] = useState("");
  const { toast, show } = useToast();

  const load = useCallback(() => {
    api<Detail>(`/reservations/${id}`).then(setD).catch((e) => setErr(e.message));
  }, [id]);
  useEffect(load, [load]);

  async function act(path: string, okMsg: string) {
    setBusy(true); setActErr("");
    try { await api(`/reservations/${id}/${path}`, { method: "POST" }); show(okMsg); setModal(""); load(); }
    catch (x) { setActErr(x instanceof ApiError ? x.message : "처리하지 못했어요."); setModal(""); }
    setBusy(false);
  }

  if (err) return <><BackButton onClick={() => router.push("/reservations")} /><div className="alert alert-negative">{err}</div></>;
  if (!d) return <Loading />;

  const stepIdx = STEPS.indexOf(d.status as Status);
  const canAct = d.isMine;
  const startOdo = d.trip?.startOdometer ?? d.startOdometer;
  const totalFuel = d.fuel.reduce((s, f) => s + Number(f.amount), 0);

  return (
    <>
      <BackButton onClick={() => router.push("/reservations")} label="내 예약" />
      <div className="stack" style={{ gap: 6 }}>
        <div className="between"><h1>{d.model}</h1><StatusChip status={d.status} overdue={d.overdue} /></div>
        <div className="card-meta">{d.plateNo} · {d.destination}</div>
        <div className="body3">{fmtDateTime(d.startAt)} ~ {fmtDateTime(d.endAt)}</div>
      </div>

      {d.overdue && <div className="alert alert-negative"><div><b>반납 시각이 지났어요.</b><br />차를 돌려주고 도착 주행거리를 입력해 주세요.</div></div>}
      {actErr && <div className="alert alert-negative">{actErr}</div>}

      {d.status === "취소" ? <div className="alert alert-info">취소된 예약이에요.</div> : (
        <div>
          <div className="step-labels">{STEPS.map((s, i) => <span key={s} className={i <= stepIdx ? "on" : ""}>{s}</span>)}</div>
          <div className="steps">{STEPS.map((s, i) => <i key={s} className={i <= stepIdx ? "on" : ""} />)}</div>
        </div>
      )}

      <div className="stats">
        <div className="card stat">
          <div className="k">출발 거리</div>
          <div className="v">{startOdo != null ? <><span className="num">{num(startOdo)}</span><span className="unit">km</span></> : <span className="muted">출발 전</span>}</div>
        </div>
        <div className="card stat">
          <div className="k">반납 예정</div>
          <div className="v"><span className="num">{fmtTime(d.endAt)}</span><span className="unit">{d.endAt.slice(5, 10).replace("-", "/")}</span></div>
        </div>
        {d.trip?.endOdometer != null && (
          <div className="card stat">
            <div className="k">도착 거리</div>
            <div className="v"><span className="num">{num(d.trip.endOdometer)}</span><span className="unit">km</span></div>
          </div>
        )}
        <div className="card stat">
          <div className="k">탑승 인원</div>
          <div className="v"><span className="num">{d.passengerCount}</span><span className="unit">명</span></div>
        </div>
      </div>

      <div className="card stack" style={{ gap: 8 }}>
        <span className="card-title">동승자</span>
        {d.companions.length === 0 ? <span className="card-meta">동승자가 없어요.</span>
          : d.companions.map((c) => (
            <div key={c.id} className="between">
              <span className="body3">{c.name}</span>
              {c.isGuest ? <span className="chip chip-caution">외부 손님{c.guestOrg ? ` · ${c.guestOrg}` : ""}</span>
                : <span className="chip chip-info">직원{c.departmentName ? ` · ${c.departmentName}` : ""}</span>}
            </div>
          ))}
      </div>

      <div className="card">
        <div className="between" style={{ marginBottom: 4 }}>
          <span className="card-title">주유 기록</span>
          {d.fuel.length > 0 && <span className="sub">합계 <span className="num">{num(totalFuel)}</span><span className="unit">원</span></span>}
        </div>
        {d.fuel.length === 0 ? <span className="card-meta">아직 주유 기록이 없어요.</span>
          : d.fuel.map((f) => (
            <div key={f.id} className="fuel-row">
              <div>
                <div className="body3">{fmtDate(f.fueledOn)}</div>
                <div className="card-meta">{num(f.liters)} L · 영수증 {f.receiptSubmitted ? "제출함" : "아직 안 냈어요"}</div>
              </div>
              <div className="amt"><span className="num">{num(f.amount)}</span><span className="unit">원</span></div>
            </div>
          ))}
      </div>

      {d.status === "확인 대기" && <div className="alert alert-info">총무팀이 확인하면 반납돼요.</div>}
      {d.status === "반납" && d.trip?.confirmedAt && <div className="alert alert-positive">{d.trip.confirmedByName ? `${d.trip.confirmedByName}님이 ` : ""}{fmtDateTime(d.trip.confirmedAt)}에 확인했어요.</div>}

      {canAct && (
        <div className="stack">
          {d.status === "예약됨" && <>
            {new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) >= d.startAt.slice(0, 10)
              ? <button className="btn btn-block" onClick={() => setModal("depart")}>출발하기</button>
              : <div className="alert alert-info">출발은 예약한 날부터 할 수 있어요.</div>}
            <button className="btn btn-tertiary btn-block" onClick={() => setModal("cancel")}>예약 취소</button>
          </>}
          {d.status === "운행 중" && <>
            <button className="btn btn-block" onClick={() => setModal("return")}>도착 입력</button>
            <button className="btn btn-secondary btn-block" onClick={() => setModal("fuel")}>주유 기록 추가</button>
          </>}
          {d.status === "확인 대기" && <button className="btn btn-secondary btn-block" onClick={() => setModal("fuel")}>주유 기록 추가</button>}
        </div>
      )}

      {modal === "depart" && <Confirm title="출발할까요?" message="출발하면 예약을 취소할 수 없어요. 출발 거리는 자동으로 기록돼요." okText="출발하기" busy={busy} onOk={() => act("depart", "출발했어요. 안전 운전하세요.")} onCancel={() => setModal("")} />}
      {modal === "cancel" && <Confirm title="예약을 취소할까요?" message="취소한 예약은 되돌릴 수 없어요." okText="예약 취소" cancelText="아니요" danger busy={busy} onOk={() => act("cancel", "예약을 취소했어요.")} onCancel={() => setModal("")} />}
      {modal === "return" && <ReturnModal id={d.id} startOdometer={startOdo} onClose={() => setModal("")} onDone={() => { setModal(""); show("도착을 입력했어요."); load(); }} />}
      {modal === "fuel" && <FuelModal id={d.id} onClose={() => setModal("")} onDone={() => { setModal(""); show("주유 기록을 저장했어요."); load(); }} />}
      {toast}
    </>
  );
}
