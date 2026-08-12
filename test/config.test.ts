import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_CURRENCY,
  EVERSEND_PAYMENT_TAG_URL,
  SITE_NAME,
} from "lib/config";

describe("config defaults", () => {
  it("does not require environment variables", () => {
    expect(SITE_NAME).toBe("RareCart");
    expect(DEFAULT_CURRENCY).toBe("GHS");
    expect(EVERSEND_PAYMENT_TAG_URL).toMatch(/^https:\/\//);
  });

  it("honors SITE_NAME and COMPANY_NAME when set", async () => {
    vi.stubEnv("SITE_NAME", "Test Store");
    vi.stubEnv("COMPANY_NAME", "Test Ltd");
    vi.resetModules();

    const fresh = await import("lib/config");
    expect(fresh.SITE_NAME).toBe("Test Store");
    expect(fresh.COMPANY_NAME).toBe("Test Ltd");

    vi.unstubAllEnvs();
  });
});
