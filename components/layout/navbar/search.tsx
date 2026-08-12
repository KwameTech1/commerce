"use client";

import { useState } from "react";
import clsx from "clsx";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Form from "next/form";
import { useRouter, useSearchParams } from "next/navigation";
import { getSearchSuggestions } from "lib/search-index";

function Highlighted({ text, term }: { text: string; term: string }) {
  const index = text.toLowerCase().indexOf(term);

  if (index < 0) {
    return <>{text}</>;
  }

  return (
    <>
      {text.slice(0, index)}
      <span className="font-semibold text-black">
        {text.slice(index, index + term.length)}
      </span>
      {text.slice(index + term.length)}
    </>
  );
}

export default function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams?.get("q") || "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = value.trim().toLowerCase();
  const suggestions = getSearchSuggestions(trimmed, 8);

  const closeSoon = () => {
    window.setTimeout(() => setOpen(false), 120);
  };

  const goTo = (term: string) => {
    setOpen(false);
    setValue(term);
    setActiveIndex(-1);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="relative flex-1">
      <Form
        action="/search"
        className="relative flex w-full rounded-full bg-white text-black"
      >
        <input
          key={searchParams?.get("q")}
          type="text"
          name="q"
          placeholder="Search for products..."
          autoComplete="off"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={closeSoon}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              event.currentTarget.blur();
              return;
            }

            if (suggestions.length === 0) {
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) =>
                index < suggestions.length - 1 ? index + 1 : 0,
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) =>
                index > 0 ? index - 1 : suggestions.length - 1,
              );
            } else if (event.key === "Enter" && activeIndex >= 0) {
              event.preventDefault();
              goTo(suggestions[activeIndex]!.title);
            }
          }}
          className="w-full rounded-l-full bg-transparent px-4 py-2 text-sm placeholder:text-neutral-500"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex flex-none items-center rounded-r-full bg-amber-400 px-4 text-black transition-colors hover:bg-amber-300"
        >
          <MagnifyingGlassIcon className="h-4" />
        </button>
      </Form>

      {open && trimmed && suggestions.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-white text-sm shadow-lg">
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.handle}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goTo(suggestion.title)}
                  className={clsx(
                    "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-black",
                    index === activeIndex
                      ? "bg-neutral-100"
                      : "hover:bg-neutral-50",
                  )}
                >
                  <span className="truncate">
                    <Highlighted text={suggestion.title} term={trimmed} />
                  </span>
                  <span className="flex-none text-xs text-neutral-400">
                    {suggestion.collections[0]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="relative flex w-full rounded-full bg-white">
      <div className="h-9 w-full rounded-l-full bg-neutral-200" />
      <div className="flex w-12 flex-none items-center justify-center rounded-r-full bg-amber-400">
        <MagnifyingGlassIcon className="h-4 text-black" />
      </div>
    </div>
  );
}
