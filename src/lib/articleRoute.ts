export function encodeArticleSlug(slug: string) {
  return encodeURIComponent(slug);
}

export function normalizeRouteSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function getArticleSectionPath(type: string) {
  if (type === "blog") return "cat-cave";
  return type;
}

export function getArticleHref(type: string, slug: string) {
  return `/${getArticleSectionPath(type)}/${encodeArticleSlug(slug)}`;
}
