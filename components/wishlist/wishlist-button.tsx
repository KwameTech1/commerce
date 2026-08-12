"use client";

import clsx from "clsx";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isWishlisted, toggleWishlistItem } from "lib/persistence/wishlist";
import { AUTH_EVENT } from "lib/persistence/users";

export function WishlistButton({
  handle,
  className,
}: {
  handle: string;
  className?: string;
}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(isWishlisted(handle));
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, [handle]);

  const toggle = () => {
    const nowWishlisted = toggleWishlistItem(handle).includes(handle);
    setActive(nowWishlisted);

    if (nowWishlisted) {
      toast.success("Added to wishlist");
    } else {
      toast("Removed from wishlist");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={clsx(
        "flex items-center justify-center rounded-full border p-3 transition-colors",
        active
          ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950"
          : "border-neutral-300 text-neutral-500 hover:border-red-300 hover:text-red-500 dark:border-neutral-700",
        className,
      )}
    >
      {active ? (
        <HeartIconSolid className="h-5 w-5" />
      ) : (
        <HeartIcon className="h-5 w-5" />
      )}
    </button>
  );
}
