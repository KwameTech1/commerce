import CartModal from "components/cart/modal";
import { AccountLink } from "components/account/account-link";
import { WishlistLink } from "components/wishlist/wishlist-link";
import { getCollections } from "lib/data";
import { SITE_NAME } from "lib/config";
import Link from "next/link";
import { Suspense } from "react";
import MobileMenu from "./mobile-menu";
import Search, { SearchSkeleton } from "./search";

export async function Navbar() {
  const collections = await getCollections();
  const topLevel = collections.filter(
    (collection) => collection.parent === null,
  );

  return (
    <header className="sticky top-0 z-40 bg-neutral-900 text-white">
      <div className="mx-auto flex max-w-(--breakpoint-2xl) items-center gap-3 px-4 py-2.5">
        <div className="flex flex-none items-center gap-3">
          <Suspense fallback={null}>
            <MobileMenu menu={collections} />
          </Suspense>
          <Link
            href="/"
            prefetch={true}
            className="flex items-center rounded-sm px-1 font-bold"
          >
            <span className="text-xl font-extrabold tracking-tight">
              {SITE_NAME}
            </span>
          </Link>
        </div>

        <div className="hidden flex-1 md:block">
          <Suspense fallback={<SearchSkeleton />}>
            <Search />
          </Suspense>
        </div>

        <div className="flex flex-none items-center gap-4">
          <AccountLink className="text-white" />
          <WishlistLink className="text-white" />
          <CartModal />
        </div>
      </div>

      <div className="hidden items-center gap-5 bg-neutral-800 px-4 py-1.5 text-sm md:flex lg:px-6">
        <nav className="flex items-center gap-4">
          {topLevel.map((collection) => (
            <Link
              key={collection.handle}
              href={collection.path}
              prefetch={true}
              className="rounded-sm px-1 text-neutral-300 hover:text-white"
            >
              {collection.title}
            </Link>
          ))}
        </nav>
      </div>

      <div className="px-4 pb-3 pt-1 md:hidden">
        <Suspense fallback={<SearchSkeleton />}>
          <Search />
        </Suspense>
      </div>
    </header>
  );
}
