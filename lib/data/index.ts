import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";
import { HIDDEN_PRODUCT_TAG, TAGS } from "lib/constants";
import type { Collection, Menu, Page, Product } from "lib/types";
import { collectionSeeds } from "./collections";
import { pages as pageSeeds } from "./pages";
import { products as allProducts } from "./products";

export type ProductFilters = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
};

const updatedAt = "2026-07-01T00:00:00.000Z";

function buildCollectionTree(): Collection[] {
  const byHandle = new Map<string, Collection>();

  for (const seed of collectionSeeds) {
    byHandle.set(seed.handle, {
      handle: seed.handle,
      title: seed.title,
      description: seed.description,
      seo: {
        title: seed.title,
        description: `${seed.title} products in the store.`,
      },
      path: `/search/${seed.handle}`,
      parent: seed.parent ?? null,
      image: seed.image,
      children: [],
      updatedAt,
    });
  }

  const topLevel: Collection[] = [];

  for (const collection of byHandle.values()) {
    const parent = collection.parent ? byHandle.get(collection.parent) : null;

    if (parent) {
      parent.children.push(collection);
    } else {
      topLevel.push(collection);
    }
  }

  return topLevel;
}

const collectionTree = buildCollectionTree();

function flattenCollections(includeHidden = false): Collection[] {
  const flat: Collection[] = [];

  for (const collection of collectionTree) {
    if (includeHidden || !collection.handle.startsWith("hidden")) {
      flat.push(collection, ...collection.children);
    }
  }

  return flat;
}

function findCollection(handle: string): Collection | undefined {
  return flattenCollections(true).find(
    (collection) => collection.handle === handle,
  );
}

function descendantHandles(collection: Collection): string[] {
  return [collection.handle, ...collection.children.flatMap(descendantHandles)];
}

const allCollection: Collection = {
  handle: "",
  title: "All",
  description: "All products",
  seo: {
    title: "All",
    description: "All products",
  },
  path: "/search",
  parent: null,
  children: [],
  updatedAt,
};

function belongsToCategory(product: Product, handle: string): boolean {
  const collection = findCollection(handle);

  if (!collection) {
    return product.collections.includes(handle);
  }

  const handles = descendantHandles(collection);
  return product.collections.some((c) => handles.includes(c));
}

function relevanceScore(product: Product, term: string): number {
  const title = product.title.toLowerCase();

  if (title.startsWith(term)) {
    return 0;
  }

  if (title.includes(term)) {
    return 1;
  }

  return 2;
}

function sortProducts(
  products: Product[],
  sortKey?: string,
  reverse?: boolean,
  query?: string,
): Product[] {
  switch (sortKey) {
    case "BEST_SELLING":
      return [...products].sort(
        (a, b) => b.ratingCount - a.ratingCount || b.rating - a.rating,
      );
    case "CREATED_AT": {
      const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
      return [...products].sort((a, b) =>
        reverse
          ? compare(a.updatedAt, b.updatedAt)
          : compare(b.updatedAt, a.updatedAt),
      );
    }
    case "PRICE": {
      const price = (product: Product) =>
        Number(product.priceRange.minVariantPrice.amount);
      return [...products].sort((a, b) =>
        reverse ? price(b) - price(a) : price(a) - price(b),
      );
    }
    case "RELEVANCE": {
      if (!query) {
        return products;
      }

      const term = query.toLowerCase();
      return [...products].sort(
        (a, b) =>
          relevanceScore(a, term) - relevanceScore(b, term) ||
          a.title.localeCompare(b.title),
      );
    }
    default:
      return products;
  }
}

function filterProducts(
  products: Product[],
  query?: string,
  filters?: ProductFilters,
): Product[] {
  let filtered = products.filter(
    (product) => !product.tags.includes(HIDDEN_PRODUCT_TAG),
  );

  if (filters?.category) {
    filtered = filtered.filter((product) =>
      belongsToCategory(product, filters.category!),
    );
  }

  if (filters?.minPrice !== undefined) {
    filtered = filtered.filter(
      (product) =>
        Number(product.priceRange.minVariantPrice.amount) >= filters.minPrice!,
    );
  }

  if (filters?.maxPrice !== undefined) {
    filtered = filtered.filter(
      (product) =>
        Number(product.priceRange.minVariantPrice.amount) <= filters.maxPrice!,
    );
  }

  if (filters?.inStockOnly) {
    filtered = filtered.filter((product) => product.availableForSale);
  }

  if (query) {
    const searchTerm = query.toLowerCase();
    filtered = filtered.filter((product) =>
      [product.title, product.description, ...product.tags]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm),
    );
  }

  return filtered;
}

export async function getProducts(
  options: {
    query?: string;
    reverse?: boolean;
    sortKey?: string;
    filters?: ProductFilters;
  } = {},
): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  const { query, reverse, sortKey, filters } = options;

  return sortProducts(
    filterProducts(allProducts, query, filters),
    sortKey,
    reverse,
    query,
  );
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  return allProducts.find((product) => product.handle === handle);
}

export async function getProductRecommendations(
  productId: string,
): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  const product = allProducts.find((p) => p.id === productId);

  if (!product) {
    return [];
  }

  const candidates = allProducts
    .filter((p) => p.id !== productId && !p.tags.includes(HIDDEN_PRODUCT_TAG))
    .map((p) => ({
      product: p,
      matches: p.collections.filter((c) => product.collections.includes(c))
        .length,
    }))
    .filter((entry) => entry.matches > 0)
    .sort(
      (a, b) =>
        b.matches - a.matches || a.product.id.localeCompare(b.product.id),
    )
    .map((entry) => entry.product);

  return candidates.slice(0, 4);
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  return [allCollection, ...flattenCollections()];
}

export async function getCollection(
  handle: string,
): Promise<Collection | undefined> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  if (handle === "") {
    return allCollection;
  }

  return findCollection(handle);
}

export async function getCollectionProducts(
  options: {
    collection: string;
    reverse?: boolean;
    sortKey?: string;
    filters?: ProductFilters;
  } = { collection: "" },
): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.collections, TAGS.products);
  cacheLife("days");

  const { collection, reverse, sortKey, filters } = options;

  const resolved = findCollection(collection);

  if (!resolved && collection !== "") {
    return [];
  }

  return sortProducts(
    filterProducts(allProducts, undefined, {
      ...filters,
      category: collection,
    }),
    sortKey,
    reverse,
  );
}

export async function getMenu(handle: string): Promise<Menu[]> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  if (handle === "next-js-frontend-header-menu") {
    return flattenCollections().map((collection) => ({
      title: collection.title,
      path: collection.path,
    }));
  }

  if (handle === "next-js-frontend-footer-menu") {
    return pageSeeds.map((page) => ({
      title: page.title,
      path: `/${page.handle}`,
    }));
  }

  return [];
}

export async function getPage(handle: string): Promise<Page | undefined> {
  "use cache";
  cacheLife("days");

  return pageSeeds.find((page) => page.handle === handle);
}

export async function getPages(): Promise<Page[]> {
  "use cache";
  cacheLife("days");

  return pageSeeds;
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  const counts: Record<string, number> = {};
  const parentByHandle = new Map<string, string>();

  for (const seed of collectionSeeds) {
    if (seed.parent) {
      parentByHandle.set(seed.handle, seed.parent);
    }
  }

  const visible = new Set(flattenCollections().map((c) => c.handle));

  const visibleProducts = allProducts.filter(
    (product) => !product.tags.includes(HIDDEN_PRODUCT_TAG),
  );

  for (const product of visibleProducts) {
    const counted = new Set<string>();

    for (const handle of product.collections) {
      let current: string | undefined = handle;

      while (current && !counted.has(current)) {
        counted.add(current);

        if (visible.has(current)) {
          counts[current] = (counts[current] ?? 0) + 1;
        }

        current = parentByHandle.get(current);
      }
    }
  }

  counts[""] = visibleProducts.length;
  return counts;
}
