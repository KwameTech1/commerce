import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cacheLife: () => undefined,
  unstable_cacheTag: () => undefined,
}));

const cookieValues = new Map<string, string>();
const cookieStore = {
  get: vi.fn((name: string) =>
    cookieValues.has(name)
      ? { name, value: cookieValues.get(name) }
      : undefined,
  ),
  set: vi.fn(
    (
      name: string,
      value: string,
      options?: { maxAge?: number; path?: string },
    ) => {
      cookieValues.set(name, value);
    },
  ),
  delete: vi.fn((name: string) => {
    cookieValues.delete(name);
  }),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

import {
  addToCart,
  clearCart,
  createCart,
  getCart,
  removeFromCart,
  updateCart,
} from "lib/cart";
import { products } from "lib/data/products";
import { DEFAULT_CURRENCY } from "lib/config";

const firstVariant = products[0]!.variants[0]!;
const secondProduct = products[1]!;
const secondVariant = secondProduct.variants[0]!;

function expectValidCart(
  cart: Awaited<ReturnType<typeof getCart>>,
  name = "cart",
) {
  expect(cart).toBeDefined();
  expect(cart!.id).toEqual(expect.any(String));
  expect(cart!.cost.subtotalAmount.currencyCode).toBe(DEFAULT_CURRENCY);
  expect(name).toBe(name);
}

describe("cookie cart", () => {
  beforeEach(() => {
    cookieValues.clear();
    cookieStore.get.mockClear();
    cookieStore.set.mockClear();
    cookieStore.delete.mockClear();
  });

  it("returns undefined before a cart cookie exists", async () => {
    expect(await getCart()).toBeUndefined();
  });

  it("creates a cart and persists the cookie", async () => {
    const cart = await createCart();
    expectValidCart(cart);
    expect(cookieStore.set).toHaveBeenCalledWith(
      "cart",
      expect.stringContaining(cart.id),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      }),
    );
  });

  it("adds lines with correct GHS math and merges duplicates", async () => {
    await createCart();
    const once = await addToCart([
      { merchandiseId: firstVariant.id, quantity: 2 },
    ]);
    const unit = Number(firstVariant.price.amount);
    expect(once.totalQuantity).toBe(2);
    expect(Number(once.cost.totalAmount.amount)).toBe(unit * 2);
    expect(once.cost.totalAmount.currencyCode).toBe("GHS");

    const merged = await addToCart([
      { merchandiseId: firstVariant.id, quantity: 3 },
      { merchandiseId: secondVariant.id, quantity: 1 },
    ]);
    const firstLine = merged.lines.find(
      (l) => l.merchandise.id === firstVariant.id,
    );
    expect(firstLine?.quantity).toBe(5);
    expect(merged.totalQuantity).toBe(6);
    const expectedTotal = unit * 5 + Number(secondVariant.price.amount);
    expect(Number(merged.cost.totalAmount.amount)).toBeCloseTo(
      expectedTotal,
      2,
    );
  });

  it("updates quantities and drops zero-quantity lines", async () => {
    await createCart();
    await addToCart([
      { merchandiseId: firstVariant.id, quantity: 4 },
      { merchandiseId: secondVariant.id, quantity: 2 },
    ]);
    const updated = await updateCart([
      { id: firstVariant.id, merchandiseId: firstVariant.id, quantity: 1 },
      { id: secondVariant.id, merchandiseId: secondVariant.id, quantity: 0 },
    ]);
    expect(updated.lines.map((l) => l.merchandise.id)).toEqual([
      firstVariant.id,
    ]);
    expect(updated.totalQuantity).toBe(1);
  });

  it("removes selected lines", async () => {
    await createCart();
    await addToCart([
      { merchandiseId: firstVariant.id, quantity: 1 },
      { merchandiseId: secondVariant.id, quantity: 1 },
    ]);
    const cart = await removeFromCart([firstVariant.id]);
    expect(cart.lines.map((l) => l.merchandise.id)).toEqual([secondVariant.id]);
  });

  it("handles a corrupted cookie by starting a fresh cart", async () => {
    cookieValues.set("cart", "{not json");
    const cart = await createCart();
    expectValidCart(cart);
  });

  it("ignores malformed cookie lines", async () => {
    cookieValues.set(
      "cart",
      JSON.stringify({
        id: "legacy",
        lines: [
          { merchandiseId: "bogus", quantity: "three" },
          { merchandiseId: firstVariant.id, quantity: 2 },
        ],
      }),
    );
    const cart = await getCart();
    expect(cart?.lines.map((l) => l.merchandise.id)).toEqual([firstVariant.id]);
  });

  it("clears the cart cookie", async () => {
    await createCart();
    await clearCart();
    expect(cookieStore.delete).toHaveBeenCalledWith("cart");
    expect(await getCart()).toBeUndefined();
  });
});
