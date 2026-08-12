import { beforeEach, describe, expect, it } from "vitest";

import {
  getSubscribers,
  isSubscribed,
  subscribe,
} from "lib/persistence/newsletter";
import { writeStorage } from "lib/persistence/storage";

describe("newsletter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("subscribes and remembers the address case-insensitively", () => {
    expect(subscribe("Ama@Example.com").ok).toBe(true);
    expect(isSubscribed("ama@example.com")).toBe(true);
    expect(getSubscribers()).toEqual(["ama@example.com"]);
  });

  it("rejects invalid emails", () => {
    expect(subscribe("not-an-email").ok).toBe(false);
    expect(subscribe("").ok).toBe(false);
    expect(getSubscribers()).toEqual([]);
  });

  it("rejects duplicate subscriptions", () => {
    expect(subscribe("ama@example.com").ok).toBe(true);
    const duplicate = subscribe("AMA@example.com");
    expect(duplicate.ok).toBe(false);
    expect(getSubscribers()).toEqual(["ama@example.com"]);
  });

  it("filters out junk from stored lists", () => {
    writeStorage("newsletter-subscribers", ["a@b.co", 42, null, "c@d.co"]);
    expect(getSubscribers()).toEqual(["a@b.co", "c@d.co"]);
  });
});
