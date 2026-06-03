import type { Metadata } from "next";
import localFont from "next/font/local";
import CanvasBackground from "@/components/CanvasBackground";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

// 2. Configure Local Brand Fonts (Google Sans & HarmonyOS Sans SC)
const googleSans = localFont({
  src: [
    {
      path: "./fonts/GoogleSans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/GoogleSans-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/GoogleSans-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-google-sans",
  fallback: ["Arial", "sans-serif"],
  display: "swap",
});

const harmonyOSSans = localFont({
  src: [
    {
      path: "./fonts/HarmonyOSSansSC-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/HarmonyOSSansSC-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/HarmonyOSSansSC-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-harmony-sans",
  fallback: ["Microsoft YaHei", "Arial", "sans-serif"],
  display: "swap",
});

// 3. SEO Metadata Configuration
export const metadata: Metadata = {
  title: {
    template: "%s | KiraMyao Equal",
    default: "KiraMyao Equal | 跨性别与性少数群体 (LGBTQ+) 关怀与倡导组织",
  },
  description: "KiraMyao Equal 是一个致力于为跨性别与性少数群体 (LGBTQ+) 提供支持、关怀与社会倡导的非政府组织 (NGO)。我们通过现代科技与包容设计，推动无边界与流动的性别平等。",
  keywords: ["KiraMyao Equal", "跨性别", "LGBTQ+", "性少数群体", "公益组织", "NGO", "性别平等", "MTF生存指南"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${googleSans.variable} ${harmonyOSSans.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col font-sans text-text-main bg-background overflow-x-hidden">
        {/* Persistent bottom canvas layer */}
        <CanvasBackground />

        {/* Global Navigation Bar */}
        <Navbar />

        {/* Core content layer */}
        <div className="relative z-10 flex-grow flex flex-col">
          {children}
        </div>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}
