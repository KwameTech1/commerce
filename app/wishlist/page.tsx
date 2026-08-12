"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeartIcon } from "@heroicons/react/24/outline";
import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { products } from "lib/data/products";
import type { Product } from "lib/types";
import { getWishlist, setWishlist } from "lib/persistence/wishlist";
import { AUTH_EVENT } from "lib/persistence/users";

export default function WishlistPage() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const sync = () => {
      const handles = getWishlist();
      const wishlisted = products.filter((product) =>
        handles.includes(product.handle),
      );
      setItems(wishlisted);
    };

    sync();
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);

  const clearAll = () => {
    setWishlist([]);
    setItems([]);
  };

  return (
    <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        {items.length > 0 ? (
          <button
            onClick={clearAll}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Clear wishlist
          </button>
        ) : null}
      </div>

      {items.length > 0 ? (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={items} />
        </Grid>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <HeartIcon className="mb-4 h-16 w-16 text-neutral-300" />
          <p className="mb-6 text-xl font-semibold">Your wishlist is empty</p>
          <p className="mb-8 max-w-md text-sm text-neutral-500">
            Tap the heart on any product to save it here for later.
          </p>
          <Link
            href="/search"
            className="rounded-full bg-amber-400 px-6 py-3 text-sm font-medium text-black hover:opacity-90"
          >
            Browse products
          </Link>
        </div>
      )}
    </div>
  );
}
