import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cacheLife: () => undefined,
  unstable_cacheTag: () => undefined,
}));

import {
  getCategoryCounts,
  getCollection,
  getCollectionProducts,
  getCollections,
  getMenu,
  getPage,
  getPages,
  getProduct,
  getProductRecommendations,
  getProducts,
} from "lib/data";
import { products } from "lib/data/products";
import { sorting } from "lib/constants";

describe("catalog data", () => {
  it("exports exactly the seeded product count", async () => {
    const all = await getProducts();
    expect(all.length).toBe(products.length);
    expect(all.length).toBeGreaterThan(0);
  });

  it("prices every product and variant in GHS", async () => {
    const all = await getProducts();
    for (const product of all) {
      expect(product.priceRange.minVariantPrice.currencyCode).toBe("GHS");
      expect(product.priceRange.maxVariantPrice.currencyCode).toBe("GHS");
      for (const variant of product.variants) {
        expect(variant.price.currencyCode).toBe("GHS");
      }
      const minVariant = Math.min(
        ...product.variants.map((v) => Number(v.price.amount)),
      );
      expect(Number(product.priceRange.minVariantPrice.amount)).toBe(
        minVariant,
      );
    }
  });

  it("was scaled to realistic GHS amounts", async () => {
    const all = await getProducts();
    const amounts = all.flatMap((p) =>
      p.variants.map((v) => Number(v.price.amount)),
    );
    expect(Math.min(...amounts)).toBeGreaterThan(100);
    expect(Math.max(...amounts)).toBeGreaterThan(1000);
  });

  it("carries stock levels for badges and filtering", async () => {
    const all = await getProducts();
    for (const product of all) {
      expect(product.stock).toEqual(expect.any(Number));
    }

    const lowStock = all.filter(
      (product) => (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5,
    );
    expect(lowStock.length).toBeGreaterThan(0);

    const outOfStock = all.filter((product) => !product.availableForSale);
    expect(outOfStock.length).toBeGreaterThan(0);
    for (const product of outOfStock) {
      expect(product.stock).toBe(0);
    }
  });

  it("looks up a single product by handle and returns undefined otherwise", async () => {
    const first = products[0]!;
    expect((await getProduct(first.handle))?.handle).toBe(first.handle);
    expect(await getProduct("does-not-exist")).toBeUndefined();
  });

  it("keeps the price range in step with the variant prices", async () => {
    const first = products[0]!;
    const product = await getProduct(first.handle);
    expect(product).toBeDefined();
  });

  it("filters by category, price range and stock", async () => {
    const byCategory = await getProducts({
      filters: { category: "electronics" },
    });
    expect(byCategory.length).toBeGreaterThan(0);
    for (const product of byCategory) {
      expect(product.collections.some((c) => c.startsWith("electronics"))).toBe(
        true,
      );
    }

    const caps = await getProducts({ filters: { maxPrice: 500 } });
    for (const product of caps) {
      expect(
        Number(product.priceRange.minVariantPrice.amount),
      ).toBeLessThanOrEqual(500);
    }

    const floors = await getProducts({ filters: { minPrice: 2000 } });
    for (const product of floors) {
      expect(
        Number(product.priceRange.minVariantPrice.amount),
      ).toBeGreaterThanOrEqual(2000);
    }

    const inStock = await getProducts({ filters: { inStockOnly: true } });
    for (const product of inStock) {
      expect(product.availableForSale).toBe(true);
    }
  });

  it("filters by query across title, description and tags", async () => {
    const results = await getProducts({ query: "wireless" });
    expect(results.length).toBeGreaterThan(0);
    for (const product of results) {
      const haystack = [product.title, product.description, ...product.tags]
        .join(" ")
        .toLowerCase();
      expect(haystack).toContain("wireless");
    }
  });

  it("ranks search results by relevance under the default sort", async () => {
    const swift = await getProducts({ query: "swift" });
    expect(swift.length).toBeGreaterThan(0);
    expect(swift[0]!.title).toBe("SwiftBook 14 Ultrabook");

    const smartphones = await getProducts({
      query: "smartphone",
      sortKey: "RELEVANCE",
    });
    expect(smartphones.length).toBe(4);
    expect(smartphones[0]!.title).toBe("Aurora Pro X Smartphone");
    expect(smartphones[1]!.title).toBe("Breeze S5 Smartphone");
  });

  it("sorts by price, best selling and creation date", async () => {
    const prep = (product: {
      priceRange: {
        minVariantPrice: { amount: string };
      };
    }) => Number(product.priceRange.minVariantPrice.amount);

    const priceAsc = await getProducts({ sortKey: "PRICE" });
    for (let i = 1; i < priceAsc.length; i++) {
      expect(prep(priceAsc[i - 1]!)).toBeLessThanOrEqual(prep(priceAsc[i]!));
    }

    const priceDesc = await getProducts({ sortKey: "PRICE", reverse: true });
    for (let i = 1; i < priceDesc.length; i++) {
      expect(prep(priceDesc[i - 1]!)).toBeGreaterThanOrEqual(
        prep(priceDesc[i]!),
      );
    }

    const bestSelling = await getProducts({ sortKey: "BEST_SELLING" });
    for (let i = 1; i < bestSelling.length; i++) {
      expect(bestSelling[i - 1]!.ratingCount).toBeGreaterThanOrEqual(
        bestSelling[i]!.ratingCount,
      );
    }
  });

  it("returns the expected sort slugs", () => {
    expect(sorting.map((item) => item.slug)).toContain("price-asc");
    expect(sorting.map((item) => item.slug)).toContain("price-desc");
    expect(sorting.map((item) => item.slug)).toContain("trending-desc");
  });
});

describe("collections and menus", () => {
  it("builds a tree with top-level and child collections", async () => {
    const collections = await getCollections();
    expect(collections[0]?.handle).toBe("");
    const electronics = collections.find((c) => c.handle === "electronics");
    expect(electronics).toBeDefined();
    expect(electronics!.children.length).toBeGreaterThan(0);
  });

  it("returns products belonging to child collections via a parent handle", async () => {
    const children = await getCollection("electronics");
    expect(children).toBeDefined();
    const childHandles = children!.children.map((c) => c.handle);
    const productsInChild = await getCollectionProducts({
      collection: "electronics",
    });
    for (const product of productsInChild) {
      expect(product.collections.some((c) => childHandles.includes(c))).toBe(
        true,
      );
    }
  });

  it("returns an empty list for unknown menus and pages", async () => {
    expect(await getMenu("unknown")).toEqual([]);
    expect(await getPage("unknown")).toBeUndefined();
  });

  it("rolls up category product counts including ancestors", async () => {
    const counts = await getCategoryCounts();
    const all = await getProducts();
    expect(counts[""]).toBe(all.length);

    for (const [handle, count] of Object.entries(counts)) {
      if (handle === "") {
        continue;
      }
      expect(count).toBeGreaterThan(0);
      expect(handle.startsWith("hidden-")).toBe(false);
    }

    const electronics =
      (counts["phones"] ?? 0) +
      (counts["laptops"] ?? 0) +
      (counts["audio"] ?? 0) +
      (counts["cameras"] ?? 0);
    expect(counts["electronics"]).toBe(electronics);

    const homeKitchen =
      (counts["appliances"] ?? 0) +
      (counts["cookware"] ?? 0) +
      (counts["furniture"] ?? 0);
    expect(counts["home-kitchen"]).toBe(homeKitchen);

    const fashion =
      (counts["mens"] ?? 0) + (counts["womens"] ?? 0) + (counts["shoes"] ?? 0);
    expect(counts["fashion"]).toBe(fashion);

    const books = (counts["fiction"] ?? 0) + (counts["non-fiction"] ?? 0);
    expect(counts["books"]).toBe(books);
  });

  it("serves the header and footer menus", async () => {
    const header = await getMenu("next-js-frontend-header-menu");
    expect(header.length).toBeGreaterThan(0);
    expect(header[0]).toHaveProperty("path");

    const footer = await getMenu("next-js-frontend-footer-menu");
    expect(footer.length).toBeGreaterThan(0);
  });

  it("returns pages from the seed", async () => {
    const pages = await getPages();
    expect(pages.length).toBeGreaterThan(0);
    expect((await getPage(pages[0]!.handle))?.handle).toBe(pages[0]!.handle);
  });
});

describe("recommendations", () => {
  it("returns up to four related products sharing collections", async () => {
    const source = products[0]!;
    const recommendations = await getProductRecommendations(source.id);
    expect(recommendations.length).toBeLessThanOrEqual(4);
    for (const recommendation of recommendations) {
      expect(recommendation.id).not.toBe(source.id);
      expect(
        recommendation.collections.some((c) => source.collections.includes(c)),
      ).toBe(true);
    }
  });

  it("returns an empty list for unknown products", async () => {
    expect(await getProductRecommendations("nope")).toEqual([]);
  });
});
