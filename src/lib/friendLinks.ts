export type FriendLink = {
  id: string;
  name: string;
  url: string;
  description?: string;
  cover?: string | null;
  /** 翻转确认层的定制文案（如官方广告）；存在时替代默认的离开提示/简介/域名 */
  note?: string;
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
    [link.name, link.description, link.note, link.url]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(normalizedQuery)),
  );
}

export const FRIEND_AD_ID = "ad-kiramyao";

/** 官方广告卡排序：始终排在真实友链之后；友链多到换页时锁定第一页最后一格 */
export function placeFriendLinkAd<T extends FriendLink>(links: T[], pageSize: number): T[] {
  const list = [...links];
  const adIndex = list.findIndex((link) => link.id === FRIEND_AD_ID);
  if (adIndex === -1) return list;
  const [ad] = list.splice(adIndex, 1);
  if (list.length >= pageSize) {
    list.splice(pageSize - 1, 0, ad);
  } else {
    list.push(ad);
  }
  return list;
}
