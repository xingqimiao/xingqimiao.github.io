import JoinClient from "@/app/join/JoinClient";
import { buildLocalizedMetadata } from "@/lib/localizedMetadata";

export const metadata = buildLocalizedMetadata({
  locale: "zh",
  chinesePath: "/join",
  title: "加入我们",
  description: "参与 KiraMyao Equal 的研究、志愿服务与社区工作。",
});

export default function JoinUsPage() {
  return <JoinClient locale="zh" />;
}
