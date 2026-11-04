"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type List } from "@/lib/api";
import { isStaff, useAuth } from "@/lib/auth";
import { daysUntil, fmtDate } from "@/lib/format";
import { Loading } from "@/components/ui";
import ReservationCard, { type Reservation } from "@/components/ReservationCard";
import { ChatIcon, WonIcon } from "@/components/Icons";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";

export default function HomePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Reservation[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<List<Reservation>>("/reservations?mine=1&size=100")
      .then((r) => setItems(r.items))
      .catch((e) => setErr(e.message));
  }, []);

  if (!user) return null;

  const upcoming = (items || [])
    .filter((r) => ["예약됨", "운행 중", "확인 대기"].includes(r.status))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 3);

  return (
    <>
      {isStaff(user) && (
        <div style={{ textAlign: "right" }}>
          <a href={ADMIN_URL} className="textbtn" style={{ fontSize: 13 }}>어드민 열기</a>
        </div>
      )}
      <h1>안녕하세요,<br />{user.name || "임직원"}님</h1>
      <LicenseNotice user={user} />
      {user.licenseStatus === "승인"
        ? <Link href="/reserve" className="btn btn-block">차량 예약하기</Link>
        : <><div className="btn btn-block is-disabled" aria-disabled="true">차량 예약하기</div><p className="help" style={{ marginTop: -4 }}>면허 만료일을 등록하고 총무팀 승인을 받으면 예약할 수 있어요.</p></>}

      <div className="section-title"><h2>다가오는 내 예약</h2><Link href="/reservations" className="textbtn">전체 보기</Link></div>
      {err ? <div className="alert alert-negative">{err}</div>
        : !items ? <Loading />
        : upcoming.length === 0 ? <div className="empty card">다가오는 예약이 없어요.</div>
        : <div className="list">{upcoming.map((r) => <ReservationCard key={r.id} r={r} />)}</div>}

      <div className="shortcuts">
        <Link href="/claims" className="card clickable shortcut"><WonIcon /><span className="card-title">개인 차량 정산</span><span className="card-meta">1km당 200원</span></Link>
        <Link href="/chat" className="card clickable shortcut"><ChatIcon /><span className="card-title">규정 챗봇</span><span className="card-meta">규정을 물어보세요</span></Link>
      </div>
    </>
  );
}

function LicenseNotice({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const st = user.licenseStatus;
  const link = <Link href="/me" className="textbtn" style={{ padding: 0, marginLeft: 4 }}>내 정보에서 확인</Link>;
  if (!st || st === "미등록" || !user.licenseExpiry) {
    return <div className="alert alert-caution"><div><b>면허 만료일을 등록해 주세요.</b><br />등록하고 총무팀 승인을 받아야 차량을 예약할 수 있어요.{link}</div></div>;
  }
  if (st === "승인 대기") {
    return <div className="alert alert-info"><div><b>면허 승인을 기다리고 있어요.</b><br />총무팀이 승인하면 예약할 수 있어요.</div></div>;
  }
  const left = daysUntil(user.licenseExpiry);
  if (left < 0) return <div className="alert alert-negative"><div><b>면허가 만료됐어요.</b><br />{fmtDate(user.licenseExpiry)}에 만료됐어요. 새 만료일을 등록해 주세요.{link}</div></div>;
  if (left <= 30) return <div className="alert alert-caution"><div><b>면허 만료일이 {left}일 남았어요.</b><br />{fmtDate(user.licenseExpiry)} 이후 날짜는 예약할 수 없어요.</div></div>;
  return null;
}
