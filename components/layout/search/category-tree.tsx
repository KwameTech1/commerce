import clsx from "clsx";
import Link from "next/link";
import { getCategoryCounts, getCollections } from "lib/data";

export async function CategoryTree({
  activeHandle,
}: {
  activeHandle?: string;
}) {
  const collections = await getCollections();
  const counts = await getCategoryCounts();
  const topLevel = collections.filter(
    (collection) => collection.parent === null,
  );

  const linkClass = (handle: string, isAll = false) =>
    clsx(
      "block w-full py-1 text-sm underline-offset-4 hover:text-black hover:underline dark:hover:text-neutral-300",
      activeHandle === handle || (isAll && !activeHandle)
        ? "font-semibold text-amber-600 dark:text-amber-400"
        : "text-neutral-500",
    );

  const Count = ({ handle }: { handle: string }) => (
    <span className="text-xs text-neutral-400 dark:text-neutral-500">
      ({counts[handle] ?? 0})
    </span>
  );

  return (
    <nav className="space-y-1">
      <h3 className="mb-2 hidden text-xs text-neutral-500 md:block dark:text-neutral-400">
        Departments
      </h3>
      <Link href="/search" className={linkClass("", true)}>
        All <Count handle="" />
      </Link>
      {topLevel.map((collection) => {
        const hasActiveChild = collection.children.some(
          (child) => child.handle === activeHandle,
        );

        return (
          <div key={collection.handle}>
            <Link
              href={collection.path}
              className={clsx(
                linkClass(collection.handle),
                hasActiveChild &&
                  "font-medium text-neutral-800 dark:text-neutral-200",
              )}
            >
              {collection.title} <Count handle={collection.handle} />
            </Link>
            {collection.children.length > 0 ? (
              <ul className="ml-3 border-l border-neutral-200 pl-2 dark:border-neutral-800">
                {collection.children.map((child) => (
                  <li key={child.handle}>
                    <Link href={child.path} className={linkClass(child.handle)}>
                      {child.title} <Count handle={child.handle} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
