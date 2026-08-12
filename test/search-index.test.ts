import { describe, expect, it } from "vitest";

import { getSearchSuggestions, searchEntries } from "lib/search-index";

describe("search suggestions", () => {
  it("indexes the catalog", () => {
    expect(searchEntries().length).toBeGreaterThan(0);
    for (const entry of searchEntries()) {
      expect(entry.handle).toEqual(expect.any(String));
      expect(entry.title).toEqual(expect.any(String));
    }
  });

  it("returns nothing for empty or short queries", () => {
    expect(getSearchSuggestions("")).toEqual([]);
    expect(getSearchSuggestions("   ")).toEqual([]);
  });

  it("ranks prefix matches above plain substring matches", () => {
    const results = getSearchSuggestions("swift");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.title).toBe("SwiftBook 14 Ultrabook");
  });

  it("sorts same-rank matches alphabetically", () => {
    const results = getSearchSuggestions("smartphone");
    expect(results.length).toBe(4);
    expect(results[0]!.title).toBe("Aurora Pro X Smartphone");
    expect(results[1]!.title).toBe("Breeze S5 Smartphone");
    expect(results[2]!.title).toBe("Nova Mini 5G Smartphone");
    expect(results[3]!.title).toBe("Zephyr V3 Smartphone");
  });

  it("matches collection names as a fallback", () => {
    const results = getSearchSuggestions("phones");
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      const matchesTitle = result.title.toLowerCase().includes("phone");
      const matchesCollection = result.collections.some((c) =>
        c.includes("phones"),
      );
      expect(matchesTitle || matchesCollection).toBe(true);
    }
  });

  it("respects the result limit", () => {
    expect(getSearchSuggestions("a", 3).length).toBeLessThanOrEqual(3);
  });
});
