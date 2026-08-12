"use client";

import clsx from "clsx";
import { HeartIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getWishlist } from "lib/persistence/wishlist";

export function WishlistLink({ className }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(getWishlist().length);
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return (
    <Link
      href="/wishlist"
      aria-label={`Wishlist, ${count} items`}
      className={clsx("relative flex items-center justify-center", className)}
    >
      <HeartIcon className="h-6 w-6" />
      {count > 0 ? (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
