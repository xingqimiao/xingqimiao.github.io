import FlexSearch from "flexsearch";

export type SearchableItem = {
  slug: string;
};

type SearchField<T> = keyof T | ((item: T) => string | string[] | undefined);

function normalizeText(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(" ");
  }
  return value || "";
}

function textForItem<T>(item: T, fields: SearchField<T>[], tokenMap?: Record<string, string[]>) {
  const chunks = fields.map((field) => {
    if (typeof field === "function") {
      return normalizeText(field(item));
    }
    return normalizeText(item[field] as string | string[] | undefined);
  });

  const slug = (item as SearchableItem).slug;
  if (slug && tokenMap?.[slug]) {
    chunks.push(tokenMap[slug].join(" "));
  }

  return chunks.join(" ").toLowerCase();
}

export function searchItems<T extends SearchableItem>(
  items: T[],
  query: string,
  fields: SearchField<T>[],
  tokenMap?: Record<string, string[]>,
) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  const index = new FlexSearch.Index({
    tokenize: "forward",
    resolution: 9,
  });
  const bySlug = new Map(items.map((item) => [item.slug, item]));

  items.forEach((item) => {
    index.add(item.slug, textForItem(item, fields, tokenMap));
  });

  const result = index.search(normalizedQuery, { limit: items.length });
  return result.map((slug) => bySlug.get(String(slug))).filter(Boolean) as T[];
}
