import { Metadata } from "next";
import JoinClient from "./JoinClient";

export const metadata: Metadata = {
  title: "加入我们",
  description: "参与《2026 中国跨性别者生存处境调查》，参与 KiraMyao Equal 志愿者招募。通过填写调查问卷或参与团队建设，共同推动无边界与流动的性别平等。",
};

export default function JoinUsPage() {
  return <JoinClient />;
}
