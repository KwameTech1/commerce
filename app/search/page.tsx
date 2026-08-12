import { LoadMore } from "components/search/load-more";
import { SearchSidebar } from "components/search/sidebar";
import { CategoryTree } from "components/layout/search/category-tree";
import { Facets } from "components/layout/search/facets";
import FilterList from "components/layout/search/filter";
import { defaultSort, sorting } from "lib/constants";
import { getProducts } from "lib/data";
import type { ProductFilters } from "lib/data";

export const metadata = {
  title: "Search",
  description: "Search for products in the store.",
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = (searchParams ?? {}) as {
    [key: string]: string;
  };
  const { sort, q: searchValue } = params;
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  const filters: ProductFilters = {
    category: params.category,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    inStockOnly: params.inStock === "true",
  };

  const products = await getProducts({
    sortKey,
    reverse,
    query: searchValue,
    filters,
  });
  const resultsText = products.length > 1 ? "results" : "result";

  return (
    <div className="flex flex-col gap-8 py-4 md:flex-row">
      <SearchSidebar>
        <CategoryTree activeHandle={params.category} />
        <Facets action="/search" params={params} />
      </SearchSidebar>
      <div className="order-last min-w-0 flex-1 md:order-none">
        {searchValue ? (
          <p className="mb-4">
            {products.length === 0
              ? "There are no products that match "
              : `Showing ${products.length} ${resultsText} for `}
            <span className="font-bold">&quot;{searchValue}&quot;</span>
          </p>
        ) : null}
        {products.length > 0 ? <LoadMore products={products} /> : null}
      </div>
      <div className="order-none flex-none md:order-last md:w-[125px]">
        <FilterList list={sorting} title="Sort by" />
      </div>
    </div>
  );
}
