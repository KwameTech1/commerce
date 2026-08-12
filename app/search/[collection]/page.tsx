import { getCollection, getCollectionProducts } from "lib/data";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";

import { LoadMore } from "components/search/load-more";
import { SearchSidebar } from "components/search/sidebar";
import { CategoryTree } from "components/layout/search/category-tree";
import { Facets } from "components/layout/search/facets";
import FilterList from "components/layout/search/filter";
import { defaultSort, sorting } from "lib/constants";
import type { ProductFilters } from "lib/data";
import Link from "next/link";

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const collection = await getCollection(params.collection);

  if (!collection) return notFound();

  return {
    title: collection.seo?.title || collection.title,
    description:
      collection.seo?.description ||
      collection.description ||
      `${collection.title} products`,
    openGraph: collection.image
      ? {
          images: [
            {
              url: collection.image.url,
              width: collection.image.width,
              height: collection.image.height,
              alt: collection.image.altText || collection.title,
            },
          ],
        }
      : null,
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const queryParams = (searchParams ?? {}) as { [key: string]: string };
  const { sort } = queryParams;
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;
  const collection = await getCollection(params.collection);

  if (!collection) return notFound();

  const filters: ProductFilters = {
    minPrice: queryParams.minPrice ? Number(queryParams.minPrice) : undefined,
    maxPrice: queryParams.maxPrice ? Number(queryParams.maxPrice) : undefined,
    inStockOnly: queryParams.inStock === "true",
  };

  const products = await getCollectionProducts({
    collection: params.collection,
    sortKey,
    reverse,
    filters,
  });

  return (
    <div className="flex flex-col gap-8 py-4 md:flex-row">
      <SearchSidebar>
        <CategoryTree activeHandle={params.collection} />
        <Facets action={collection.path} params={queryParams} />
      </SearchSidebar>
      <div className="order-last min-w-0 flex-1 md:order-none">
        {collection.image ? (
          <div className="relative mb-4 h-36 w-full overflow-hidden rounded-lg md:h-48">
            <Image
              src={collection.image.url}
              alt={collection.image.altText || collection.title}
              fill
              sizes="(min-width: 768px) 60vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        ) : null}
        <nav className="mb-4 text-sm text-neutral-500">
          <Link href="/search" className="hover:underline">
            All
          </Link>
          {" / "}
          <span className="text-black dark:text-white">{collection.title}</span>
        </nav>
        <h1 className="mb-4 text-2xl font-bold">{collection.title}</h1>
        {products.length === 0 ? (
          <p className="py-3 text-lg">No products found in this collection</p>
        ) : (
          <LoadMore products={products} />
        )}
      </div>
      <div className="order-none flex-none md:order-last md:w-[125px]">
        <FilterList list={sorting} title="Sort by" />
      </div>
    </div>
  );
}
