import { FacetIcon } from "components/icons/facet-icon";

export function Facets({
  action,
  params,
}: {
  action: string;
  params: Record<string, string | string[] | undefined>;
}) {
  const asString = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  };

  return (
    <form action={action} method="GET" className="mt-6 space-y-4">
      <input type="hidden" name="q" value={asString("q")} />
      <input type="hidden" name="sort" value={asString("sort")} />
      <input type="hidden" name="category" value={asString("category")} />

      <div>
        <h3 className="mb-2 hidden text-xs text-neutral-500 md:block dark:text-neutral-400">
          Price
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="minPrice"
            min={0}
            placeholder="Min"
            defaultValue={asString("minPrice")}
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <span className="text-neutral-400">–</span>
          <input
            type="number"
            name="maxPrice"
            min={0}
            placeholder="Max"
            defaultValue={asString("maxPrice")}
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-500">
        <input
          type="checkbox"
          name="inStock"
          value="true"
          defaultChecked={asString("inStock") === "true"}
          className="h-4 w-4"
        />
        In stock only
      </label>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
      >
        <FacetIcon />
        Apply filters
      </button>
    </form>
  );
}
