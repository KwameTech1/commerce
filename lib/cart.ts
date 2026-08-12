import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";
import { cookies } from "next/headers";
import { TAGS } from "lib/constants";
import { DEFAULT_CURRENCY } from "lib/config";
import type { Cart, CartItem, Money } from "lib/types";
import { products } from "lib/data/products";

const CART_COOKIE = "cart";
const CART_MAX_AGE = 60 * 60 * 24 * 30;

type CartCookie = {
  id: string;
  lines: { merchandiseId: string; quantity: number }[];
};

function parseCart(raw: string | undefined): CartCookie {
  if (!raw) {
    return { id: crypto.randomUUID(), lines: [] };
  }

  try {
    const parsed = JSON.parse(raw);

    if (
      parsed &&
      typeof parsed.id === "string" &&
      Array.isArray(parsed.lines)
    ) {
      const lines = parsed.lines.filter(
        (line: unknown) =>
          line &&
          typeof (line as { merchandiseId?: unknown }).merchandiseId ===
            "string" &&
          typeof (line as { quantity?: unknown }).quantity === "number",
      );

      return { id: parsed.id, lines };
    }
  } catch {
    // Fall through to a fresh cart for corrupted cookies.
  }

  return { id: crypto.randomUUID(), lines: [] };
}

function findVariant(merchandiseId: string) {
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === merchandiseId);

    if (variant) {
      return { product, variant };
    }
  }

  return undefined;
}

function money(amount: number, currencyCode: string): Money {
  return { amount: amount.toFixed(2), currencyCode };
}

function buildCart(cookie: CartCookie): Cart {
  const lines: CartItem[] = [];
  let subtotal = 0;

  for (const line of cookie.lines) {
    const found = findVariant(line.merchandiseId);

    if (!found) {
      continue;
    }

    const { product, variant } = found;
    const unitPrice = Number(variant.price.amount);
    const lineTotal = unitPrice * line.quantity;
    subtotal += lineTotal;

    lines.push({
      id: variant.id,
      quantity: line.quantity,
      cost: {
        totalAmount: money(lineTotal, variant.price.currencyCode),
      },
      merchandise: {
        id: variant.id,
        title: variant.title,
        selectedOptions: variant.selectedOptions,
        product: {
          id: product.id,
          handle: product.handle,
          title: product.title,
          featuredImage: product.featuredImage,
        },
      },
    });
  }

  const currency = lines[0]?.cost.totalAmount.currencyCode ?? DEFAULT_CURRENCY;

  return {
    id: cookie.id,
    checkoutUrl: "/checkout",
    cost: {
      subtotalAmount: money(subtotal, currency),
      totalAmount: money(subtotal, currency),
      totalTaxAmount: money(0, currency),
    },
    lines,
    totalQuantity: lines.reduce((sum, item) => sum + item.quantity, 0),
  };
}

async function writeCartCookie(cookie: CartCookie) {
  (await cookies()).set(CART_COOKIE, JSON.stringify(cookie), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CART_MAX_AGE,
    path: "/",
  });
}

async function readCartCookie(): Promise<CartCookie> {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE)?.value);
}

export async function getCart(): Promise<Cart | undefined> {
  "use cache: private";
  cacheTag(TAGS.cart);
  cacheLife("seconds");

  const store = await cookies();

  if (!store.get(CART_COOKIE)?.value) {
    return undefined;
  }

  return buildCart(parseCart(store.get(CART_COOKIE)?.value));
}

export async function createCart(): Promise<Cart> {
  const cookie = await readCartCookie();
  await writeCartCookie(cookie);
  return buildCart(cookie);
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const cookie = await readCartCookie();

  for (const line of lines) {
    const existing = cookie.lines.find(
      (item) => item.merchandiseId === line.merchandiseId,
    );

    if (existing) {
      existing.quantity += line.quantity;
    } else {
      cookie.lines.push({ ...line });
    }
  }

  await writeCartCookie(cookie);
  return buildCart(cookie);
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cookie = await readCartCookie();
  cookie.lines = cookie.lines.filter(
    (line) => !lineIds.includes(line.merchandiseId),
  );
  await writeCartCookie(cookie);
  return buildCart(cookie);
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const cookie = await readCartCookie();

  for (const line of lines) {
    const existing = cookie.lines.find(
      (item) => item.merchandiseId === line.merchandiseId,
    );

    if (existing) {
      existing.quantity = line.quantity;
    }
  }

  cookie.lines = cookie.lines.filter((line) => line.quantity > 0);
  await writeCartCookie(cookie);
  return buildCart(cookie);
}

export async function clearCart(): Promise<void> {
  (await cookies()).delete(CART_COOKIE);
}
