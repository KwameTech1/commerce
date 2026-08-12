import type { Image, Product, ProductVariant, Review } from "lib/types";

const baseDate = Date.UTC(2026, 6, 1);

// Seed prices are stored in GHS; convert the small USD reference values once
// so variants, price ranges, carts and totals all stay consistent.
const GHS_FACTOR = 15.5;

// Units on hand per product. Low numbers surface "Only N left" badges;
// out-of-stock products carry 0.
const stockLevels: Record<string, number> = {
  "aurora-pro-x": 24,
  "breeze-s5": 8,
  "titan-fold": 5,
  "swiftbook-14": 12,
  "gamerforce-16": 4,
  "aerobook-air": 0,
  "pulsebuds-pro": 32,
  "echowave-headphones": 18,
  "boombox-mini": 3,
  "snapshot-200": 6,
  "vividcam-mirrorless": 2,
  "retrofilm-35": 0,
  "frostmate-fridge": 7,
  "turboair-fryer": 21,
  "steamclean-washer": 9,
  "chefpro-pan-set": 15,
  "castiron-dutch": 11,
  "blademaster-knives": 26,
  "cloudnine-sofa": 5,
  "oakdesk-standing": 13,
  "ergolite-chair": 19,
  "urban-hoodie": 42,
  "classic-chinos": 37,
  "aria-dress": 28,
  "softwear-cardigan": 16,
  "runner-go-5": 44,
  "streetstep-sneakers": 31,
  "trailblaze-boots": 2,
  "silent-harbor": 58,
  "echoes-of-tomorrow": 46,
  "art-of-focus": 39,
  "startup-playbook": 63,
  "nova-mini-5g": 17,
  "zephyr-v3": 14,
  "studiopro-15": 6,
  "minibook-flip": 9,
  "soundsphere-31": 10,
  "vibe-sport-buds": 33,
  "dronehawk-4k": 4,
  "trailcam-action": 12,
  "frostbar-mini": 8,
  "powerbrew-espresso": 7,
  "sautemaster-wok": 22,
  "baristapour-kit": 18,
  "luna-nightstand": 14,
  "flexform-bookshelf": 11,
  "denimfield-jacket": 24,
  "atlas-oxford": 35,
  "breeze-maxi-skirt": 20,
  "silkroad-scarf": 41,
  "glide-sandals": 38,
  "courtclassic-trainers": 16,
  "lantern-house": 52,
  "summer-of-tides": 47,
  "money-basics": 55,
  "sleep-reset": 44,
};

const img = (handle: string, n: number): Image => ({
  url: `/products/${handle}-${n}.png`,
  altText: "",
  width: 800,
  height: 800,
});

const images = (handle: string, count = 3): Image[] =>
  Array.from({ length: count }, (_, i) => img(handle, i + 1));

let variantCounter = 0;
let productCounter = 0;

function variant(
  title: string,
  price: number,
  selectedOptions: { name: string; value: string }[] = [],
  availableForSale = true,
): ProductVariant {
  return {
    id: `v-${++variantCounter}`,
    title,
    availableForSale,
    selectedOptions,
    price: { amount: price.toFixed(2), currencyCode: "GHS" },
  };
}

const reviewAuthors = [
  "Amara",
  "Dami",
  "Chidi",
  "Ngozi",
  "Tunde",
  "Zara",
  "Kofi",
  "Amina",
  "Femi",
  "Lara",
];

const reviewTitles = [
  "Great buy",
  "Happy customer",
  "Solid quality",
  "Good value",
  "Impressed",
  "Recommended",
  "Works well",
  "Worth it",
  "Love it",
  "Five stars",
];

const reviewBodies = [
  "Exactly as described. Quality is great and delivery was fast.",
  "Solid purchase for the price. Would buy again.",
  "Works perfectly out of the box. Very happy with it.",
  "Good value, though I wish the packaging were better.",
  "Really impressed with the build quality.",
  "Great product, exceeded my expectations.",
  "Decent for the price, does what it says.",
  "My new favorite. Highly recommended.",
  "Took a while to arrive but worth the wait.",
  "Buying a second one as a gift.",
];

function sampleReviews(index: number): Review[] {
  const count = 2 + (index % 2);
  const now = baseDate;
  return Array.from({ length: count }, (_, i) => {
    const seed = index * 3 + i;
    return {
      id: `r-${index}-${i}`,
      author: reviewAuthors[seed % reviewAuthors.length]!,
      rating: 3 + ((seed * 7) % 3),
      title: reviewTitles[seed % reviewTitles.length]!,
      body: reviewBodies[seed % reviewBodies.length]!,
      createdAt: new Date(now - (seed + 1) * 7 * 86400000).toISOString(),
    };
  });
}

type ProductInput = {
  handle: string;
  title: string;
  description: string;
  price: number;
  collections: string[];
  tags?: string[];
  options?: { name: string; values: string[] }[];
  variants?: ProductVariant[];
  availableForSale?: boolean;
  imageCount?: number;
  reviews?: Review[];
  featured?: boolean;
  hasReviews?: boolean;
};

function product({
  handle,
  title,
  description,
  price,
  collections,
  tags = [],
  options = [],
  variants,
  availableForSale = true,
  imageCount = 3,
  reviews,
  featured = false,
  hasReviews = false,
}: ProductInput): Product {
  const ghcPrice = price * GHS_FACTOR;
  const allVariants =
    variants ??
    (options.length
      ? options[0]!.values.map((value) =>
          variant(`${title} / ${value}`, ghcPrice, [
            { name: options[0]!.name, value },
          ]),
        )
      : [variant("Default Title", ghcPrice)]);

  const allReviews =
    reviews ?? (featured || hasReviews ? sampleReviews(productCounter) : []);

  const rating =
    allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

  const productImages = images(handle, imageCount);

  return {
    id: `p-${++productCounter}`,
    handle,
    availableForSale,
    stock: stockLevels[handle],
    title,
    description,
    descriptionHtml: `<p>${description}</p>`,
    options: options.map((option) => ({
      id: `o-${handle}-${option.name.toLowerCase()}`,
      name: option.name,
      values: option.values,
    })),
    priceRange: {
      minVariantPrice: {
        amount: Math.min(
          ...allVariants.map((v) => Number(v.price.amount)),
        ).toFixed(2),
        currencyCode: "GHS",
      },
      maxVariantPrice: {
        amount: Math.max(
          ...allVariants.map((v) => Number(v.price.amount)),
        ).toFixed(2),
        currencyCode: "GHS",
      },
    },
    variants: allVariants,
    featuredImage: productImages[0]!,
    images: productImages,
    seo: { title, description },
    tags,
    collections,
    rating: Math.round(rating * 10) / 10,
    ratingCount: allReviews.length,
    reviews: allReviews,
    updatedAt: new Date(baseDate - productCounter * 3 * 86400000).toISOString(),
  };
}

export const products: Product[] = [
  product({
    handle: "aurora-pro-x",
    title: "Aurora Pro X Smartphone",
    description:
      "A 6.7-inch AMOLED flagship with a 200MP camera, all-day battery and a titanium frame. The Pro X handles anything you throw at it, from mobile gaming to pro photography.",
    price: 899.0,
    collections: ["phones", "electronics", "hidden-homepage-featured-items"],
    tags: ["featured"],
    featured: true,
  }),
  product({
    handle: "breeze-s5",
    title: "Breeze S5 Smartphone",
    description:
      "A dependable everyday phone with a bright 6.5-inch display, dual cameras and two full days of battery life. Great value for money.",
    price: 349.0,
    collections: ["phones", "electronics"],
  }),
  product({
    handle: "titan-fold",
    title: "Titan Fold Tablet",
    description:
      "An 11-inch foldable tablet that doubles as a mini laptop. Built for reading, sketching and working on the go with a 120Hz display.",
    price: 1299.0,
    collections: ["phones", "electronics"],
  }),
  product({
    handle: "swiftbook-14",
    title: "SwiftBook 14 Ultrabook",
    description:
      "A 1.2kg ultrabook with a 14-inch 2.8K display, 16GB of RAM and a 512GB SSD. The SwiftBook keeps up with a full day of work on a single charge.",
    price: 1099.0,
    collections: ["laptops", "electronics"],
  }),
  product({
    handle: "gamerforce-16",
    title: "GamerForce 16 Gaming Laptop",
    description:
      "A 16-inch gaming laptop with a 165Hz screen, RTX-class graphics and RGB backlit keyboard. Plays the latest titles at max settings.",
    price: 1899.0,
    collections: ["laptops", "electronics", "hidden-homepage-carousel"],
  }),
  product({
    handle: "aerobook-air",
    title: "AeroBook Air Laptop",
    description:
      "Feather-light 13-inch laptop designed for students and commuters. Silent, fanless and ready for years of daily use.",
    price: 749.0,
    collections: ["laptops", "electronics"],
    availableForSale: false,
  }),
  product({
    handle: "pulsebuds-pro",
    title: "PulseBuds Pro Earbuds",
    description:
      "Wireless earbuds with active noise cancellation, spatial audio and a 30-hour total battery life with the charging case.",
    price: 129.0,
    collections: [
      "audio",
      "electronics",
      "hidden-homepage-featured-items",
      "hidden-homepage-carousel",
    ],
    tags: ["featured"],
    featured: true,
  }),
  product({
    handle: "echowave-headphones",
    title: "EchoWave Headphones",
    description:
      "Over-ear headphones with studio-grade sound, plush memory foam cushions and multipoint Bluetooth pairing.",
    price: 199.0,
    collections: ["audio", "electronics"],
  }),
  product({
    handle: "boombox-mini",
    title: "BoomBox Mini Speaker",
    description:
      "A pocket-sized Bluetooth speaker with surprisingly big sound, 12-hour playtime and IPX7 waterproofing.",
    price: 79.0,
    collections: ["audio", "electronics", "hidden-homepage-carousel"],
  }),
  product({
    handle: "snapshot-200",
    title: "SnapShot 200 Instant Camera",
    description:
      "An instant camera that prints credit-card-sized photos in seconds. Includes a selfie mirror, flash and lens cover.",
    price: 89.0,
    collections: ["cameras", "electronics"],
  }),
  product({
    handle: "vividcam-mirrorless",
    title: "VividCam Mirrorless Camera",
    description:
      "A full-frame mirrorless camera with 4K video, in-body stabilization and a wide dynamic range. A creator's workhorse.",
    price: 1299.0,
    collections: ["cameras", "electronics", "hidden-homepage-carousel"],
  }),
  product({
    handle: "retrofilm-35",
    title: "RetroFilm 35 Camera",
    description:
      "A beautiful 35mm film camera with a manual lens, mechanical shutter and a look that never goes out of style.",
    price: 249.0,
    collections: ["cameras", "electronics"],
    availableForSale: false,
  }),
  product({
    handle: "frostmate-fridge",
    title: "FrostMate Refrigerator",
    description:
      "A 500L inverter fridge with a frost-free freezer, smart temperature control and energy rating A+++.",
    price: 1450.0,
    collections: ["appliances", "home-kitchen"],
  }),
  product({
    handle: "turboair-fryer",
    title: "TurboAir Fryer",
    description:
      "A 5.5L air fryer that crisps food with up to 85% less oil. Nine presets, a digital touch panel and dishwasher-safe basket.",
    price: 119.0,
    collections: ["appliances", "home-kitchen", "hidden-homepage-carousel"],
  }),
  product({
    handle: "steamclean-washer",
    title: "SteamClean Washer",
    description:
      "A front-load washing machine with a 10kg drum, steam cleaning cycle and a quiet inverter motor.",
    price: 899.0,
    collections: ["appliances", "home-kitchen"],
  }),
  product({
    handle: "chefpro-pan-set",
    title: "ChefPro Pan Set",
    description:
      "A 5-piece non-stick cookware set with heat-distributing bases and comfortable stay-cool handles. Oven safe to 230°C.",
    price: 159.0,
    collections: ["cookware", "home-kitchen"],
  }),
  product({
    handle: "castiron-dutch",
    title: "CastIron Dutch Oven",
    description:
      "A 6-quart enameled cast iron Dutch oven that goes from stovetop to oven. Perfect for slow braises and sourdough.",
    price: 89.0,
    collections: ["cookware", "home-kitchen"],
  }),
  product({
    handle: "blademaster-knives",
    title: "BladeMaster Knife Set",
    description:
      "A 6-piece German steel knife set with a self-sharpening block and ergonomic handles.",
    price: 129.0,
    collections: ["cookware", "home-kitchen"],
  }),
  product({
    handle: "cloudnine-sofa",
    title: "CloudNine Sofa",
    description:
      "A 3-seater sofa with deep cushions, a solid hardwood frame and washable covers. The kind you sink into after a long day.",
    price: 1399.0,
    collections: [
      "furniture",
      "home-kitchen",
      "hidden-homepage-featured-items",
    ],
    tags: ["featured"],
    featured: true,
  }),
  product({
    handle: "oakdesk-standing",
    title: "OakDesk Standing Desk",
    description:
      "A dual-motor electric standing desk with a solid oak top and four programmable height presets.",
    price: 499.0,
    collections: ["furniture", "home-kitchen"],
  }),
  product({
    handle: "ergolite-chair",
    title: "ErgoLite Office Chair",
    description:
      "An ergonomic office chair with lumbar support, adjustable armrests and breathable mesh back.",
    price: 249.0,
    collections: ["furniture", "home-kitchen", "hidden-homepage-carousel"],
  }),
  product({
    handle: "urban-hoodie",
    title: "Urban Hoodie",
    description:
      "A heavyweight cotton hoodie with a fleece lining, kangaroo pocket and double-stitched seams. Pre-shrunk and built to last.",
    price: 49.0,
    collections: ["mens", "fashion", "hidden-homepage-carousel"],
    options: [{ name: "Color", values: ["Black", "Grey", "Navy"] }],
    tags: ["featured"],
  }),
  product({
    handle: "classic-chinos",
    title: "Classic Chinos",
    description:
      "Stretch cotton chinos with a modern slim fit and reinforced stitching. Comfortable enough for all day, sharp enough for the office.",
    price: 59.0,
    collections: ["mens", "fashion"],
    options: [{ name: "Size", values: ["S", "M", "L", "XL"] }],
  }),
  product({
    handle: "aria-dress",
    title: "Aria Dress",
    description:
      "A midi dress in soft viscose with a flattering wrap silhouette. Machine washable and easy to dress up or down.",
    price: 69.0,
    collections: ["womens", "fashion"],
    options: [
      { name: "Color", values: ["Emerald", "Blush"] },
      { name: "Size", values: ["S", "M", "L"] },
    ],
  }),
  product({
    handle: "softwear-cardigan",
    title: "SoftWear Cardigan",
    description:
      "A chunky knit cardigan made from a brushed wool-blend. Warm, soft and finished with wooden buttons.",
    price: 79.0,
    collections: ["womens", "fashion"],
  }),
  product({
    handle: "runner-go-5",
    title: "RunnerGo 5 Running Shoes",
    description:
      "A daily trainer with responsive foam, a breathable upper and a rocker sole that keeps you moving. Great for road and track.",
    price: 129.0,
    collections: ["shoes", "fashion", "hidden-homepage-carousel"],
    options: [{ name: "Size", values: ["40", "41", "42", "43", "44", "45"] }],
  }),
  product({
    handle: "streetstep-sneakers",
    title: "StreetStep Sneakers",
    description:
      "Clean leather sneakers with a cushioned footbed and a gum rubber outsole. Minimal styling, maximum comfort.",
    price: 99.0,
    collections: ["shoes", "fashion"],
    options: [{ name: "Size", values: ["40", "41", "42", "43", "44"] }],
  }),
  product({
    handle: "trailblaze-boots",
    title: "TrailBlaze Hiking Boots",
    description:
      "Waterproof hiking boots with grippy Vibram soles and ankle support for rough terrain. Broken in from the first walk.",
    price: 159.0,
    collections: ["shoes", "fashion"],
    options: [{ name: "Size", values: ["41", "42", "43", "44", "45", "46"] }],
  }),
  product({
    handle: "silent-harbor",
    title: "The Silent Harbor",
    description:
      "A gripping literary thriller set on a fog-bound island where a harbor master's disappearance unravels a town's secrets. 432 pages.",
    price: 19.99,
    collections: ["fiction", "books", "hidden-homepage-carousel"],
  }),
  product({
    handle: "echoes-of-tomorrow",
    title: "Echoes of Tomorrow",
    description:
      "A near-future science fiction novel about memory, identity and the cost of technology. Shortlisted for the Nova Prize.",
    price: 17.99,
    collections: ["fiction", "books"],
  }),
  product({
    handle: "art-of-focus",
    title: "The Art of Focus",
    description:
      "A practical guide to deep work in a distracted world: how to reclaim attention, build systems and finish what matters.",
    price: 24.99,
    collections: ["non-fiction", "books"],
  }),
  product({
    handle: "startup-playbook",
    title: "The Startup Playbook",
    description:
      "Field-tested playbooks for launching, pricing and growing a product — from founders who have shipped to real customers.",
    price: 29.99,
    collections: ["non-fiction", "books"],
  }),
  product({
    handle: "nova-mini-5g",
    title: "Nova Mini 5G Smartphone",
    description:
      "A compact 5.9-inch 5G phone for people who want flagship speed in a pocketable size. Great camera, great grip.",
    price: 299.0,
    collections: ["phones", "electronics"],
    hasReviews: true,
  }),
  product({
    handle: "zephyr-v3",
    title: "Zephyr V3 Smartphone",
    description:
      "A mid-range workhorse with a 120Hz display, 65W fast charging and a 108MP main camera. Two-day battery life.",
    price: 449.0,
    collections: ["phones", "electronics"],
    hasReviews: true,
  }),
  product({
    handle: "studiopro-15",
    title: "StudioPro 15 Creator Laptop",
    description:
      "A 15-inch 4K OLED laptop for creators: 32GB RAM, 1TB SSD and a color-accurate screen that editors and designers love.",
    price: 1699.0,
    collections: ["laptops", "electronics"],
    hasReviews: true,
  }),
  product({
    handle: "minibook-flip",
    title: "MiniBook Flip Convertible",
    description:
      "A 12-inch 2-in-1 touchscreen convertible that folds from laptop to tablet. Light enough for every commute.",
    price: 599.0,
    collections: ["laptops", "electronics"],
    hasReviews: true,
  }),
  product({
    handle: "soundsphere-31",
    title: "SoundSphere 3.1 Soundbar",
    description:
      "A 3.1-channel soundbar with a wireless subwoofer and clear dialogue mode. Turns any TV night into a cinema night.",
    price: 259.0,
    collections: ["audio", "electronics"],
    hasReviews: true,
  }),
  product({
    handle: "vibe-sport-buds",
    title: "Vibe Sport Earbuds",
    description:
      "Sweatproof sport earbuds with secure wingtips, punchy bass and a 40-hour total playtime with the charging case.",
    price: 89.0,
    collections: ["audio", "electronics"],
    hasReviews: true,
  }),
  product({
    handle: "dronehawk-4k",
    title: "DroneHawk 4K Drone",
    description:
      "A foldable drone with a 3-axis gimbal, 4K camera and 30-minute flight time. Follow-me and one-tap return home.",
    price: 549.0,
    collections: ["cameras", "electronics"],
    hasReviews: true,
  }),
  product({
    handle: "trailcam-action",
    title: "TrailCam Action Camera",
    description:
      "A rugged action camera that shoots 5K60 and is waterproof to 10m. Built for trails, waves and everything between.",
    price: 199.0,
    collections: ["cameras", "electronics"],
    hasReviews: true,
  }),
  product({
    handle: "frostbar-mini",
    title: "FrostBar Mini Fridge",
    description:
      "A 120L mini fridge with a separate freezer shelf, adjustable legs and whisper-quiet cooling. Perfect for dorms and offices.",
    price: 349.0,
    collections: ["appliances", "home-kitchen"],
    hasReviews: true,
  }),
  product({
    handle: "powerbrew-espresso",
    title: "PowerBrew Espresso Machine",
    description:
      "A 15-bar pump espresso machine with a steam wand for silky lattes at home. Brushed steel, built to last.",
    price: 429.0,
    collections: ["appliances", "home-kitchen"],
    hasReviews: true,
  }),
  product({
    handle: "sautemaster-wok",
    title: "SautéMaster Carbon Wok",
    description:
      "A 32cm carbon steel wok that seasons beautifully and heats evenly for authentic stir-fries at high heat.",
    price: 69.0,
    collections: ["cookware", "home-kitchen"],
    hasReviews: true,
  }),
  product({
    handle: "baristapour-kit",
    title: "BaristaPour Coffee Kit",
    description:
      "A gooseneck kettle and ceramic dripper set for precise pour-over coffee. The weekend ritual you'll keep.",
    price: 59.0,
    collections: ["cookware", "home-kitchen"],
    hasReviews: true,
  }),
  product({
    handle: "luna-nightstand",
    title: "Luna Nightstand",
    description:
      "A solid wood nightstand with two soft-close drawers and a warm natural finish. Compact, sturdy, timeless.",
    price: 149.0,
    collections: ["furniture", "home-kitchen"],
    hasReviews: true,
  }),
  product({
    handle: "flexform-bookshelf",
    title: "FlexForm Bookshelf",
    description:
      "A modular 5-tier bookshelf in oak veneer. Rearrange the shelves to fit books, plants and everything you collect.",
    price: 189.0,
    collections: ["furniture", "home-kitchen"],
    hasReviews: true,
  }),
  product({
    handle: "denimfield-jacket",
    title: "DenimField Trucker Jacket",
    description:
      "A stonewashed denim trucker jacket with chest pockets and a relaxed fit that only gets better with wear.",
    price: 89.0,
    collections: ["mens", "fashion"],
    options: [{ name: "Size", values: ["S", "M", "L", "XL"] }],
    hasReviews: true,
  }),
  product({
    handle: "atlas-oxford",
    title: "Atlas Oxford Shirt",
    description:
      "A wrinkle-resistant cotton oxford shirt with a tailored fit. Sharp under a blazer, easy on laundry day.",
    price: 45.0,
    collections: ["mens", "fashion"],
    options: [{ name: "Size", values: ["S", "M", "L", "XL"] }],
    hasReviews: true,
  }),
  product({
    handle: "breeze-maxi-skirt",
    title: "Breeze Maxi Skirt",
    description:
      "A flowy pleated maxi skirt with an elastic waistband. Moves beautifully and packs without creasing.",
    price: 55.0,
    collections: ["womens", "fashion"],
    options: [{ name: "Size", values: ["XS", "S", "M", "L"] }],
    hasReviews: true,
  }),
  product({
    handle: "silkroad-scarf",
    title: "SilkRoad Scarf",
    description:
      "A 90cm silk-blend scarf with a hand-finished edge. Light, warm and easy to wear three ways.",
    price: 39.0,
    collections: ["womens", "fashion"],
    hasReviews: true,
  }),
  product({
    handle: "glide-sandals",
    title: "Glide Comfort Sandals",
    description:
      "Slide sandals with contoured arch support and a cloud-soft footbed. Your feet will thank you at the end of every day.",
    price: 49.0,
    collections: ["shoes", "fashion"],
    options: [{ name: "Size", values: ["38", "39", "40", "41", "42", "43"] }],
    hasReviews: true,
  }),
  product({
    handle: "courtclassic-trainers",
    title: "Court Classic Trainers",
    description:
      "Retro leather trainers with a cushioned cupsole and gold heel accent. Vintage looks, modern comfort.",
    price: 119.0,
    collections: ["shoes", "fashion"],
    options: [{ name: "Size", values: ["40", "41", "42", "43", "44", "45"] }],
    hasReviews: true,
  }),
  product({
    handle: "lantern-house",
    title: "The House on Lantern Lane",
    description:
      "A gothic mystery about an old house, a locked attic and three generations of secrets. Atmospheric and impossible to put down.",
    price: 16.99,
    collections: ["fiction", "books"],
    hasReviews: true,
  }),
  product({
    handle: "summer-of-tides",
    title: "The Summer of Tides",
    description:
      "A coming-of-age story set on a quiet coast where two old friends spend one last summer together. Heartfelt and tender.",
    price: 15.99,
    collections: ["fiction", "books"],
    hasReviews: true,
  }),
  product({
    handle: "money-basics",
    title: "Money Basics",
    description:
      "A no-nonsense guide to budgeting, saving and investing for people starting from zero. Simple steps, real results.",
    price: 21.99,
    collections: ["non-fiction", "books"],
    hasReviews: true,
  }),
  product({
    handle: "sleep-reset",
    title: "The Sleep Reset",
    description:
      "The science of better sleep in seven days: routines, environment and mindset shifts that actually stick.",
    price: 23.99,
    collections: ["non-fiction", "books"],
    hasReviews: true,
  }),
];
