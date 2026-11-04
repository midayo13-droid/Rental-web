"use client";
import { useRouter } from "next/navigation";
import { fmtRange } from "@/lib/format";
import { StatusChip } from "./ui";

export type Reservation = {
  id: number; vehicleId: number; model: string; plateNo: string; driverName: string; departmentName: string;
  startAt: string; endAt: string; destination: string; passengerCount: number; status: string;
  tripId: number | null; startOdometer: number | null; endOdometer: number | null;
  overdue: boolean; distanceWarning: boolean;
};

export default function ReservationCard({ r }: { r: Reservation }) {
  const router = useRouter();
  return (
    <div className="card clickable stack" style={{ gap: 6 }} role="link" tabIndex={0}
      onClick={() => router.push(`/reservations/${r.id}`)}
      onKeyDown={(e) => { if (e.key === "Enter") router.push(`/reservations/${r.id}`); }}>
      <div className="between">
        <span className="card-title">{r.model} · {r.plateNo}</span>
        <StatusChip status={r.status} overdue={r.overdue} />
      </div>
      <div className="body3">{fmtRange(r.startAt, r.endAt)}</div>
      <div className="card-meta">{r.destination} · 탑승 {r.passengerCount}명</div>
    </div>
  );
}
