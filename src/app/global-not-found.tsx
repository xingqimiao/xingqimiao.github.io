import type { Metadata } from "next";
import { NotFoundContent } from "@/components/NotFoundContent";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 | KiraMyao Equal",
  description: "页面未找到。",
};

export default function GlobalNotFound() {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-black font-sans text-white">
        <NotFoundContent locale="zh" />
      </body>
    </html>
  );
}
