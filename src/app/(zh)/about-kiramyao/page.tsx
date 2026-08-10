import { buildLocalizedMetadata } from "@/lib/localizedMetadata";
import { AboutKiraMyaoContent } from "@/app/about-kiramyao/AboutKiraMyaoContent";

export const metadata = buildLocalizedMetadata({
  locale: "zh",
  chinesePath: "/about-kiramyao",
  title: "关于 KiraMyao",
  description: "了解 KiraMyao Equal 的起源与创始人的故事。",
});

export default function AboutKiraMyaoPage() {
  return <AboutKiraMyaoContent locale="zh" />;
}
