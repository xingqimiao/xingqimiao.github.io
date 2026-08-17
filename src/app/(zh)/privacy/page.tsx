import privacyData from "@/data/privacy.json";
import { buildLocalizedMetadata } from "@/lib/localizedMetadata";
import { pageJsonLd } from "@/lib/jsonLd";
import { PrivacyPolicyContent } from "@/app/privacy/PrivacyPolicyContent";

const page = {
  title: privacyData.title || "隐私与数据处理说明",
  description: "KiraMyao Equal 如何保护访问者、研究参与者与敏感社群数据。",
  path: "/privacy",
};

export const metadata = buildLocalizedMetadata({
  locale: "zh",
  chinesePath: page.path,
  title: page.title,
  description: page.description,
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd(page)) }}
      />
      <PrivacyPolicyContent locale="zh" />
    </>
  );
}
