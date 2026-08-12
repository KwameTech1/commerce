import Link from "next/link";
import Image from "next/image";
import { getCollection, getCollectionProducts } from "lib/data";

type CategoryTile = {
  handle: string;
  title: string;
  imageUrl: string;
};

async function getTiles(): Promise<CategoryTile[]> {
  const handles = ["electronics", "home-kitchen", "fashion", "books"];
  const tiles: CategoryTile[] = [];

  for (const handle of handles) {
    const collection = await getCollection(handle);
    const products = await getCollectionProducts({ collection: handle });

    if (collection && products[0]) {
      tiles.push({
        handle,
        title: collection.title,
        imageUrl: collection.image?.url ?? products[0].featuredImage.url,
      });
    }
  }

  return tiles;
}

export async function CategoryTiles() {
  const tiles = await getTiles();

  return (
    <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-8">
      <h2 className="mb-4 text-2xl font-bold">Shop by category</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.handle}
            href={`/search/${tile.handle}`}
            prefetch={true}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800"
          >
            <Image
              src={tile.imageUrl}
              alt={tile.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-contain p-4 transition duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-semibold text-white">
              {tile.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
