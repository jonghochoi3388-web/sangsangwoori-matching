import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "상상우리 — 시니어 일자리 매칭",
  description: "시니어와 일자리를 자동으로 연결합니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        <header className="bg-blue-700 text-white shadow-md">
          <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-8">
            <span className="text-2xl font-bold tracking-tight">🤝 상상우리</span>
            <Link
              href="/register"
              className="text-xl font-semibold hover:underline hover:text-yellow-200 transition-colors"
            >
              프로필 등록
            </Link>
            <Link
              href="/recommendations"
              className="text-xl font-semibold hover:underline hover:text-yellow-200 transition-colors"
            >
              추천 일자리
            </Link>
            <Link
              href="/admin"
              className="text-xl font-semibold hover:underline hover:text-yellow-200 transition-colors"
            >
              담당자 대시보드
            </Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-blue-900 text-white text-center py-4 text-lg">
          © 2026 상상우리 · 시니어 일자리 자동 매칭 시스템
        </footer>
      </body>
    </html>
  );
}
