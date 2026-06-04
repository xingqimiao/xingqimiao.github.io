import { Metadata } from "next";
import ReportListClient from "./ReportListClient";

export const metadata: Metadata = {
  title: "研究、数据与报告",
  description: "在此阅读由 KiraMyao Equal 发布的跨性别与性少数群体 (LGBTQ+) 生存处境研究报告。我们基于第一手匿名统计数据提供深度交叉分析，为公共表达与社会倡议提供科学坚实的依据。",
};

export default function ReportListPage() {
  return <ReportListClient />;
}
