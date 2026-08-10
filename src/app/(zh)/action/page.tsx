import ActionClient from "@/app/action/ActionClient";
import { buildLocalizedMetadata } from "@/lib/localizedMetadata";
import { buildActionPresentation } from "@/lib/actionPresentation";
import actionsData from "@/data/actions.json";

const copy = buildActionPresentation("zh", actionsData as Parameters<typeof buildActionPresentation>[1]);

export const metadata = buildLocalizedMetadata({
  locale: "zh",
  chinesePath: "/action",
  title: copy.metadataTitle,
  description: copy.metadataDescription,
});

export default function ActionPage() {
  return <ActionClient locale="zh" />;
}
