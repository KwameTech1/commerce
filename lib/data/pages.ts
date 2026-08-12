import type { Page } from "lib/types";

export const pages: Page[] = [
  {
    id: "p-about",
    title: "About",
    handle: "about",
    bodySummary: "Learn about our store and what we stand for.",
    body: `
<p>MaxCards is a demo storefront built to feel like a full ecommerce experience: browse categories, search the catalog, read reviews, save items to your wishlist, and check out through our payment link.</p>
<p>Everything you see here — products, prices, reviews — is sample data stored locally in the repository. No external commerce backend is required to run the store.</p>
`,
    seo: {
      title: "About",
      description: "Learn about our store and what we stand for.",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "p-terms",
    title: "Terms of Service",
    handle: "terms",
    bodySummary: "The terms that apply when you use this store.",
    body: `
<p>These terms cover your use of this demo storefront. Orders placed through the store are processed via our payment link; payment confirmation is provided by the customer on the checkout page.</p>
<p>Sample products are not shipped. Do not enter real payment details while testing the demo.</p>
`,
    seo: {
      title: "Terms of Service",
      description: "The terms that apply when you use this store.",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "p-privacy",
    title: "Privacy Policy",
    handle: "privacy",
    bodySummary: "How we handle your data.",
    body: `
<p>This is a demo store. Accounts, orders, reviews and wishlists are stored in your browser's local storage on your own device. Clearing your browser data removes them.</p>
<p>We do not collect or transmit personal data to any server, beyond what your browser does to load this site.</p>
`,
    seo: {
      title: "Privacy Policy",
      description: "How we handle your data.",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "p-contact",
    title: "Contact",
    handle: "contact",
    bodySummary: "Get in touch with us.",
    body: `
<p>Questions about an order? Reach out via the contact form on this page.</p>
<p>Payment for orders placed in this demo is collected through our Eversend payment link.</p>
`,
    seo: {
      title: "Contact",
      description: "Get in touch with us.",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];
