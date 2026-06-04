import { Metadata } from "next";
import BlogListClient from "./BlogListClient";

export const metadata: Metadata = {
  title: "最新博文与观点",
  description: "阅读 KiraMyao Equal 的最新博客文章、社群指南与政策解读。在此获取最新的跨性别与性少数群体 (LGBTQ+) 生存手册、心理自助与研究洞察。",
};

export default function BlogListPage() {
  return <BlogListClient />;
}
