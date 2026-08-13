import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { Pagination } from "components/search/pagination";
import { SearchSidebar } from "components/search/sidebar";
import { CategoryTree } from "components/layout/search/category-tree";
import { Facets } from "components/layout/search/facets";
import FilterList from "components/layout/search/filter";
import { defaultSort, sorting } from "lib/constants";
import { getProducts } from "lib/data";
import type { ProductFilters } from "lib/data";

const PAGE_SIZE = 12;

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
  const page = Math.max(1, Number(params.page) || 1);
  const start = (page - 1) * PAGE_SIZE;
  const visible = products.slice(start, start + PAGE_SIZE);

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
        {products.length > 0 ? (
          <>
            <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <ProductGridItems products={visible} />
            </Grid>
            <Pagination
              path="/search"
              params={params}
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={products.length}
            />
          </>
        ) : null}
      </div>
      <div className="order-none flex-none md:order-last md:w-[125px]">
        <FilterList list={sorting} title="Sort by" />
      </div>
    </div>
  );
}
