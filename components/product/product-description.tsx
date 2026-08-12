import { AddToCart } from "components/cart/add-to-cart";
import Price from "components/price";
import Prose from "components/prose";
import { WishlistButton } from "components/wishlist/wishlist-button";
import { Product } from "lib/types";
import { RatingLine } from "./rating-line";
import { VariantSelector } from "./variant-selector";

export function ProductDescription({ product }: { product: Product }) {
  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-2 text-4xl font-bold md:text-5xl">{product.title}</h1>
        <RatingLine
          rating={product.rating}
          count={product.ratingCount}
          className="mb-4"
        />
      </div>
      <div className="mb-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="mb-2 flex items-center justify-between">
          <Price
            className="text-3xl font-bold"
            amount={product.priceRange.maxVariantPrice.amount}
            currencyCode={product.priceRange.maxVariantPrice.currencyCode}
          />
          {!product.availableForSale ? (
            <span className="text-sm font-medium text-red-600">
              Out of stock
            </span>
          ) : product.stock !== undefined &&
            product.stock > 0 &&
            product.stock <= 5 ? (
            <span className="text-sm font-medium text-amber-600">
              Only {product.stock} left in stock
            </span>
          ) : (
            <span className="text-sm font-medium text-green-600">In stock</span>
          )}
        </div>
        <VariantSelector
          options={product.options}
          variants={product.variants}
        />
        {product.descriptionHtml ? (
          <Prose
            className="mb-4 text-sm leading-tight dark:text-white/[60%]"
            html={product.descriptionHtml}
          />
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <AddToCart product={product} />
          </div>
          <WishlistButton handle={product.handle} />
        </div>
      </div>
    </>
  );
}
