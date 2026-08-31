export type FriendLink = {
  id: string;
  name: string;
  url: string;
  description?: string;
  cover?: string | null;
};

export const friendLinksCopy = {
  label: "Friend Links",
  confirmNote: "即将离开本站，前往外部链接",
  confirmGo: "确认前往",
  confirmCancel: "取消",
  empty: "友链会显示在这里。",
  noMatch: "当前视图中没有匹配的友链。",
} as const;

export function openFriendLink(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

// 友链数量少且 name/description 多为中文，FlexSearch 的 forward 分词不切 CJK 单字，
// 直接子串匹配对中英文都可靠。
export function filterFriendLinks(links: FriendLink[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return links;
  return links.filter((link) =>
    [link.name, link.description, link.url]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(normalizedQuery)),
  );
}
