import type { Image, SEO } from "lib/types";

export type CollectionSeed = {
  handle: string;
  title: string;
  description: string;
  parent?: string;
  image?: Image;
};

export const collectionSeeds: CollectionSeed[] = [
  {
    handle: "electronics",
    title: "Electronics",
    description:
      "Phones, laptops, audio gear and cameras from the best brands.",
  },
  {
    handle: "phones",
    title: "Phones & Tablets",
    description: "Smartphones and tablets for every budget.",
    parent: "electronics",
    image: {
      url: "/collections/phones.png",
      altText: "Phones & Tablets",
      width: 800,
      height: 800,
    },
  },
  {
    handle: "laptops",
    title: "Laptops",
    description: "Ultrabooks, workstations and gaming laptops.",
    parent: "electronics",
  },
  {
    handle: "audio",
    title: "Audio",
    description: "Headphones, earbuds and speakers.",
    parent: "electronics",
  },
  {
    handle: "cameras",
    title: "Cameras",
    description: "Mirrorless, DSLR and instant cameras.",
    parent: "electronics",
  },
  {
    handle: "home-kitchen",
    title: "Home & Kitchen",
    description: "Appliances, cookware and furniture for your home.",
  },
  {
    handle: "appliances",
    title: "Appliances",
    description: "Refrigerators, washers and small kitchen appliances.",
    parent: "home-kitchen",
  },
  {
    handle: "cookware",
    title: "Cookware",
    description: "Pans, knives and everything you need to cook.",
    parent: "home-kitchen",
  },
  {
    handle: "furniture",
    title: "Furniture",
    description: "Sofas, desks and chairs built to last.",
    parent: "home-kitchen",
  },
  {
    handle: "fashion",
    title: "Fashion",
    description: "Clothing and shoes for men and women.",
  },
  {
    handle: "mens",
    title: "Men's Fashion",
    description: "Hoodies, chinos and men's essentials.",
    parent: "fashion",
  },
  {
    handle: "womens",
    title: "Women's Fashion",
    description: "Dresses, cardigans and women's essentials.",
    parent: "fashion",
  },
  {
    handle: "shoes",
    title: "Shoes",
    description: "Running, casual and outdoor footwear.",
    parent: "fashion",
  },
  {
    handle: "books",
    title: "Books",
    description: "Fiction and non-fiction bestsellers.",
  },
  {
    handle: "fiction",
    title: "Fiction",
    description: "Novels and stories worth getting lost in.",
    parent: "books",
  },
  {
    handle: "non-fiction",
    title: "Non-fiction",
    description: "Ideas, skills and true stories.",
    parent: "books",
  },
  // Special collections powering homepage sections. Handles starting
  // with `hidden-` are filtered out of the search sidebar.
  {
    handle: "hidden-homepage-featured-items",
    title: "Featured Items",
    description: "Products featured on the homepage.",
  },
  {
    handle: "hidden-homepage-carousel",
    title: "Homepage Carousel",
    description: "Products shown in the homepage carousel.",
  },
];

export function collectionSeo(handle: string, title: string): SEO {
  return {
    title,
    description: `${title} products in the store.`,
  };
}

export function collectionDescription(seed: CollectionSeed): string {
  return seed.description;
}
