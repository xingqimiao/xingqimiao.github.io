import { Metadata } from "next";
import ActionClient from "./ActionClient";

export const metadata: Metadata = {
  title: "行动与项目",
  description: "查看 KiraMyao Equal 正在进行的社会倡导行动与关怀项目。我们致力于改善跨性别与性少数群体的生存处境，并通过数据调研、故事传播与科技包容，实现可见、可及的改变。",
};

export default function ActionPage() {
  return <ActionClient />;
}
