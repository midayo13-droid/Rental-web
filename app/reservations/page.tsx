"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type List } from "@/lib/api";
import { Loading } from "@/components/ui";
import ReservationCard, { type Reservation } from "@/components/ReservationCard";

const FILTERS = ["전체", "예약됨", "운행 중", "확인 대기", "반납", "취소"];

export default function ReservationsPage() {
  const [items, setItems] = useState<Reservation[] | null>(null);
  const [filter, setFilter] = useState("전체");
  const [err, setErr] = useState("");

  useEffect(() => {
    api<List<Reservation>>("/reservations?mine=1&size=200")
      .then((r) => setItems([...r.items].sort((a, b) => b.startAt.localeCompare(a.startAt))))
      .catch((e) => setErr(e.message));
  }, []);

  const shown = (items || []).filter((r) => filter === "전체" || r.status === filter);

  return (
    <>
      <div className="between"><h1>내 예약</h1><Link href="/reserve" className="btn btn-sm">예약하기</Link></div>
      <div className="chips" role="tablist">
        {FILTERS.map((f) => <button key={f} className={`pick ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}
      </div>
      {err ? <div className="alert alert-negative">{err}</div>
        : !items ? <Loading />
        : shown.length === 0 ? <div className="empty card">{filter === "전체" ? "아직 예약이 없어요." : `${filter} 예약이 없어요.`}</div>
        : <>
            <div className="sub">총 <span className="num">{shown.length}</span>건</div>
            <div className="list">{shown.map((r) => <ReservationCard key={r.id} r={r} />)}</div>
          </>}
    </>
  );
}
