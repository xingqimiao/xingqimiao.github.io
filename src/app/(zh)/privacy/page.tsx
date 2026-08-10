import privacyData from "@/data/privacy.json";
import { buildLocalizedMetadata } from "@/lib/localizedMetadata";
import { PrivacyPolicyContent } from "@/app/privacy/PrivacyPolicyContent";

export const metadata = buildLocalizedMetadata({
  locale: "zh",
  chinesePath: "/privacy",
  title: privacyData.title || "隐私与数据处理说明",
  description: "KiraMyao Equal 如何保护访问者、研究参与者与敏感社群数据。",
});

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent locale="zh" />;
}
