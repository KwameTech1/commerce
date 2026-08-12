import { Hero } from "components/home/hero";
import { CategoryTiles } from "components/home/category-tiles";
import { ThreeItemGrid } from "components/grid/three-items";
import { Carousel } from "components/carousel";
import Footer from "components/layout/footer";

export const metadata = {
  description:
    "High-performance ecommerce store built with Next.js, featuring a local catalog, reviews, wishlist and Eversend checkout.",
  openGraph: {
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryTiles />
      <section className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-2">
        <h2 className="mb-4 text-2xl font-bold">Featured products</h2>
        <ThreeItemGrid />
      </section>
      <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-8">
        <h2 className="mb-4 text-2xl font-bold">Trending now</h2>
        <Carousel />
      </section>
      <Footer />
    </>
  );
}
