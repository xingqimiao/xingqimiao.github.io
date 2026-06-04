import { Metadata } from "next";
import StoryListClient from "./StoryListClient";

export const metadata: Metadata = {
  title: "真实的心声与记录",
  description: "在这里聆听来自跨性别与性少数群体 (LGBTQ+) 的真实个人经历与内心独白。我们记录多元的性别故事，破除刻板印象，展现鲜活真实的生命历程。",
};

export default function StoryListPage() {
  return <StoryListClient />;
}
