"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export function SearchSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="order-first w-full flex-none md:max-w-[220px]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="mb-3 flex w-full items-center justify-between rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium md:hidden dark:border-neutral-800"
      >
        Departments & filters
        <ChevronDownIcon
          className={clsx("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>
      <div className={clsx(open ? "block" : "hidden", "md:block")}>
        {children}
      </div>
    </aside>
  );
}
