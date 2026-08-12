import Grid from "components/grid";
import { GridTileImage } from "components/grid/tile";
import { WishlistButton } from "components/wishlist/wishlist-button";
import { Product } from "lib/types";
import Link from "next/link";

export default function ProductGridItems({
  products,
}: {
  products: Product[];
}) {
  return (
    <>
      {products.map((product) => (
        <Grid.Item key={product.handle} className="animate-fadeIn">
          <div className="group relative">
            <Link
              className="relative inline-block h-full w-full"
              href={`/product/${product.handle}`}
              prefetch={true}
            >
              <GridTileImage
                alt={product.title}
                label={{
                  title: product.title,
                  amount: product.priceRange.maxVariantPrice.amount,
                  currencyCode: product.priceRange.maxVariantPrice.currencyCode,
                  rating: product.rating,
                  ratingCount: product.ratingCount,
                }}
                src={product.featuredImage?.url}
                fill
                sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            </Link>
            <div className="absolute right-2 top-2 z-10">
              <WishlistButton handle={product.handle} />
            </div>
          </div>
        </Grid.Item>
      ))}
    </>
  );
}
