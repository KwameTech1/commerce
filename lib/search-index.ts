import { products } from "lib/data/products";

export type SearchEntry = {
  handle: string;
  title: string;
  collections: string[];
};

const index: SearchEntry[] = products.map((product) => ({
  handle: product.handle,
  title: product.title,
  collections: product.collections,
}));

export function searchEntries(): SearchEntry[] {
  return index;
}

export function getSearchSuggestions(query: string, limit = 8): SearchEntry[] {
  const term = query.trim().toLowerCase();

  if (!term) {
    return [];
  }

  const scored: { entry: SearchEntry; score: number }[] = [];

  for (const entry of index) {
    const title = entry.title.toLowerCase();
    let score = -1;

    if (title.startsWith(term)) {
      score = 0;
    } else if (title.includes(term)) {
      score = 1;
    } else if (
      entry.collections.some((collection) => collection.includes(term))
    ) {
      score = 2;
    }

    if (score >= 0) {
      scored.push({ entry, score });
    }
  }

  return scored
    .sort(
      (a, b) => a.score - b.score || a.entry.title.localeCompare(b.entry.title),
    )
    .slice(0, limit)
    .map(({ entry }) => entry);
}
