import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

function buildQuery(
  params: SearchParams,
  overrides: Record<string, string>,
): string {
  const merged: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (key === "page") {
      continue;
    }

    if (typeof value === "string" && value) {
      merged[key] = value;
    } else if (Array.isArray(value) && value[0]) {
      merged[key] = value[0];
    }
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value) {
      merged[key] = value;
    }
  }

  const query = new URLSearchParams(merged).toString();
  return query ? `?${query}` : "";
}

export function Pagination({
  path,
  params,
  page,
  pageSize,
  totalItems,
}: {
  path: string;
  params: SearchParams;
  page: number;
  pageSize: number;
  totalItems: number;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  const remaining = Math.max(0, totalItems - page * pageSize);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
      {page > 1 ? (
        <Link
          href={`${path}${buildQuery(params, { page: String(page - 1) })}`}
          className="rounded-full border border-neutral-300 px-6 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          ← Previous
        </Link>
      ) : null}
      {page < totalPages ? (
        <Link
          href={`${path}${buildQuery(params, { page: String(page + 1) })}`}
          className="rounded-full border border-neutral-300 px-6 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Show more ({remaining} remaining)
        </Link>
      ) : null}
    </div>
  );
}
