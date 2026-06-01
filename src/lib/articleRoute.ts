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
