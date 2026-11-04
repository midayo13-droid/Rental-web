import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./app.css";
import { AuthProvider } from "@/lib/auth";
import Shell from "@/components/Shell";

export const metadata: Metadata = { title: "누리상사 법인차량", description: "누리상사 법인차량 예약·운행 기록" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider><Shell>{children}</Shell></AuthProvider>
      </body>
    </html>
  );
}
