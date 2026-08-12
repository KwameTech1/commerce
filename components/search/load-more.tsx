"use client";

import { useState } from "react";
import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import type { Product } from "lib/types";

const PAGE_SIZE = 12;

export function LoadMore({ products }: { products: Product[] }) {
  const [visibleCount, setVisibleCount] = useState(
    Math.min(PAGE_SIZE, products.length),
  );
  const remaining = products.length - visibleCount;

  return (
    <>
      <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <ProductGridItems products={products.slice(0, visibleCount)} />
      </Grid>
      {remaining > 0 ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((count) =>
                Math.min(count + PAGE_SIZE, products.length),
              )
            }
            className="rounded-full border border-neutral-300 px-6 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Show more ({remaining} remaining)
          </button>
        </div>
      ) : null}
    </>
  );
}
