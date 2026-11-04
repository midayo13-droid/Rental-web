"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { CarIcon, HomeIcon, UserIcon } from "./Icons";
import { Loading } from "./ui";
import PasswordForm from "./PasswordForm";

const PUBLIC = ["/login", "/signup"];

export default function Shell({ children }: { children: ReactNode }) {
  const { user, ready, mustChange, clearMustChange, logout } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC.includes(path);

  useEffect(() => {
    if (ready && !user && !mustChange && !isPublic) router.replace("/login");
  }, [ready, user, mustChange, isPublic, router]);

  if (isPublic) return <div className="frame"><main className="page bare">{children}</main></div>;
  if (!ready || (!user && !mustChange)) return <div className="frame"><div style={{ padding: 16 }}><Loading /></div></div>;

  if (mustChange) {
    return (
      <div className="frame">
        <header className="topbar">
          <span className="brand">비밀번호 바꾸기</span>
          <button className="textbtn dark" onClick={() => { logout(); router.replace("/login"); }}>로그아웃</button>
        </header>
        <main className="page"><PasswordForm forced onDone={clearMustChange} /></main>
      </div>
    );
  }

  const tabs = [
    { href: "/", label: "홈", icon: <HomeIcon />, on: path === "/" },
    { href: "/reservations", label: "예약", icon: <CarIcon />, on: path.startsWith("/reservations") || path === "/reserve" },
    { href: "/me", label: "내 정보", icon: <UserIcon />, on: path === "/me" },
  ];
  return (
    <div className="frame">
      <header className="topbar"><span className="brand">누리상사 차량</span></header>
      <main className="page">{children}</main>
      <nav className="tabbar" aria-label="메뉴">
        {tabs.map((t) => <Link key={t.href} href={t.href} className={t.on ? "on" : ""}>{t.icon}{t.label}</Link>)}
      </nav>
    </div>
  );
}
