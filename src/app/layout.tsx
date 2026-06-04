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
const siteUrl = "https://kiraequal.org";
const siteDescription =
  "KiraMyao Equal 是一个关注跨性别与性少数群体处境的公益信息网站，发布生存指南、研究报告、真实故事与倡导行动，整理安全、隐私友好的公共资料，帮助更多人被看见、被理解并获得支持。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | KiraMyao Equal",
    default: "KiraMyao Equal | 跨性别与性少数群体公益信息与倡导网站",
  },
  description: siteDescription,
  keywords: ["KiraMyao Equal", "KiraEqual", "kiraequal.org", "跨性别", "LGBTQ+", "性少数群体", "公益信息", "性别平等", "MTF生存指南"],
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "KiraMyao Equal | 跨性别与性少数群体公益信息与倡导网站",
    description: siteDescription,
    url: siteUrl,
    siteName: "KiraMyao Equal",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KiraMyao Equal | 跨性别与性少数群体公益信息与倡导网站",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
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
