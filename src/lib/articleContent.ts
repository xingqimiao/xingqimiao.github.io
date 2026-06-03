function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSrc(value: string) {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

export function stripDuplicateLeadImage(contentHtml: string, coverName?: string) {
  if (!coverName) return contentHtml;

  const normalizedCover = normalizeSrc(coverName);
  const imageBlockPattern = /<p>\s*<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*\/?>\s*<\/p>/i;
  const match = contentHtml.match(imageBlockPattern);
  if (!match) return contentHtml;

  const imageSrc = normalizeSrc(match[1]);
  if (imageSrc !== normalizedCover) return contentHtml;

  return contentHtml.replace(new RegExp(escapeRegExp(match[0])), "").trimStart();
}
