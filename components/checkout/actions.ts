"use server";

import { clearCart } from "lib/cart";
import { TAGS } from "lib/constants";
import { updateTag } from "next/cache";

export async function clearCartAfterOrder() {
  await clearCart();
  updateTag(TAGS.cart);
}
