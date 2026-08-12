import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white">
      <div className="mx-auto flex max-w-(--breakpoint-2xl) flex-col items-center gap-6 px-4 py-14 text-center md:py-20">
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
          Everything you need, in one place
        </h1>
        <p className="max-w-xl text-neutral-300">
          Explore our catalog, read reviews, save favorites to your wishlist and
          check out in minutes.
        </p>
        <Link
          href="/search"
          className="rounded-full bg-amber-400 px-8 py-4 text-sm font-bold text-black transition-colors hover:bg-amber-300"
        >
          Start shopping
        </Link>
      </div>
    </section>
  );
}
