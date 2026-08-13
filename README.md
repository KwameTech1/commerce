# RareCart

A standalone, Amazon-style ecommerce storefront built with the Next.js App Router. It runs with **zero required environment variables**: the catalog is a local seed, carts live in a cookie, and payments are collected through an embedded [Eversend](https://eversend.me) payment tag.

Forked from [Vercel Commerce](https://github.com/vercel/commerce), reimplemented without a third-party commerce backend.

## Features

- **Local catalog** — 32 products across a category tree, seeded in `lib/data/products.ts` with images in `public/products/`.
- **Category tree + faceted filters** — departments, price, and availability filters in `app/search/**`.
- **Cookie-based cart** — persists for 30 days, server-rendered via `cache()`, no account required.
- **Eversend checkout** — the payment page (`https://eversend.me/maxcards`) is embedded as an iframe; the customer confirms completion in-app.
- **Order receipts** — a receipt page per order (`/confirmation/<orderId>`) with status, items, totals, and an optional Eversend payment reference.
- **Reviews & ratings** — star ratings per product with average aggregation.
- **Wishlist** — per-account wishlist with guest lists merged on sign-in, saved in `localStorage`.
- **Accounts & orders** — browser-local users (salted SHA-256 hashes) with profile editing, password change, and account deletion (order history is kept); orders tie to your account on checkout.
- **Search** — relevance-ranked product, category, and description search with a typeahead dropdown in the navbar.
- **Amazon-style UI** — dark navigation bar, departments dropdown, category tiles, amber call-to-actions.

> No product data, payments, or accounts ever hit an external API. Everything is local or embedded.

## Tech stack

- [Next.js](https://nextjs.org) 15 (App Router, React Server Components, Server Actions)
- [Tailwind CSS](https://tailwindcss.com) v4
- [Headless UI](https://headlessui.com)
- TypeScript, `pnpm`

## Running locally

No environment variables or accounts required.

```bash
pnpm install
pnpm dev
```

Your app should now be running on [localhost:3000](http://localhost:3000/).

Store name and company name can be overridden via `SITE_NAME` and `COMPANY_NAME`
in `.env.local` (see [`.env.example`](.env.example)); sensible defaults live in
[`lib/config.ts`](lib/config.ts).

## Testing

Unit tests for the pure logic (data layer, cart, persistence, config, search
index) run on Vitest; `pnpm build` acts as the type check:

```bash
pnpm test
pnpm build
```

## Project structure

| Path                  | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `lib/data/*`          | Static product, collection, menu and page data |
| `lib/cart.ts`         | Cookie-backed cart                             |
| `lib/persistence/*`   | Browser-local orders, reviews, users, wishlist |
| `lib/search-index.ts` | Pure client-safe suggestions index             |
| `lib/config.ts`       | Site-wide configuration defaults               |
| `components/cart`     | Cart drawer and add-to-cart flow               |
| `components/checkout` | Eversend iframe checkout                       |
| `components/home`     | Homepage hero and category tiles               |
| `components/layout`   | Navbar, hero, footer layout                    |
| `components/product`  | Product page, buy box, reviews                 |
| `app/search`          | Category tree, facets, collections             |
| `app/confirmation`    | Order receipt pages                            |
| `test/`               | Vitest unit tests                              |
| `public/products`     | Generated product images                       |
| `public/collections`  | Optional category banner images                |

## Payments

Checkout embeds the Eversend payment tag via `EVERSEND_PAYMENT_TAG_URL` in
`lib/config.ts`, overridable with the same-named variable in `.env.local`
(see [`.env.example`](.env.example)). The built-in default
(`https://eversend.me/maxcards`) is a demo placeholder and does not lead to a
real payment page — the checkout shows a configuration warning until you set
your own Eversend tag (create one at [eversend.me](https://eversend.me)). No
Eversend API keys or webhooks are used; payment confirmation is
customer-asserted through the "I've completed payment" button, after which the
order is marked as paid.

## Deployment

Deploy anywhere, e.g.:

```bash
vercel --prod
```

## License

MIT — see [`LICENSE`](LICENSE).
