import { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "关于我们",
  description: "了解 KiraMyao Equal 跨性别与性少数群体 (LGBTQ+) 关怀与倡导组织的使命与愿景。我们通过现代科技与包容性设计，推动性别平等的倡导工作。",
};

export default function AboutPage() {
  return <AboutClient />;
}
