import Link from "next/link";

import { getMenu } from "lib/data";
import { COMPANY_NAME, SITE_NAME } from "lib/config";
import { Suspense } from "react";
import FooterMenu from "components/layout/footer-menu";
import { NewsletterForm } from "components/layout/newsletter-form";

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightDate = 2023 + (currentYear > 2023 ? `-${currentYear}` : "");
  const skeleton =
    "w-full h-6 animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-700";
  const categories = await getMenu("next-js-frontend-header-menu");
  const pages = await getMenu("next-js-frontend-footer-menu");
  const copyrightName = COMPANY_NAME || SITE_NAME || "";

  return (
    <footer className="mt-10 border-t border-neutral-200 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-8 px-6 py-12 text-sm md:grid-cols-4 md:px-4 min-[1320px]:px-0">
        <div>
          <Link
            className="flex items-center gap-2 text-black md:pt-1 dark:text-white"
            href="/"
          >
            <span className="text-lg font-extrabold tracking-tight">
              {SITE_NAME}
            </span>
          </Link>
          <p className="mt-3 max-w-[220px]">
            A demo storefront featuring a local catalog, reviews, wishlist and
            Eversend checkout.
          </p>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-black dark:text-white">
            Departments
          </h3>
          <Suspense
            fallback={
              <div className="flex flex-col gap-2">
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
              </div>
            }
          >
            <FooterMenu menu={categories} />
          </Suspense>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-black dark:text-white">
            Help
          </h3>
          <Suspense
            fallback={
              <div className="flex flex-col gap-2">
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
              </div>
            }
          >
            <FooterMenu menu={pages} />
          </Suspense>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-black dark:text-white">
            Your account
          </h3>
          <ul>
            {[
              { title: "Sign in", path: "/login" },
              { title: "Create account", path: "/register" },
              { title: "Wishlist", path: "/wishlist" },
              { title: "Checkout", path: "/checkout" },
            ].map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className="block p-2 hover:text-black hover:underline md:inline-block md:p-0.5 md:py-1 dark:hover:text-neutral-300"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-7xl px-6 py-10 md:px-4 min-[1320px]:px-0">
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-neutral-200 py-6 text-sm dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-1 px-4 md:flex-row md:gap-0 md:px-4 min-[1320px]:px-0">
          <p>
            &copy; {copyrightDate} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith(".")
              ? "."
              : ""}{" "}
            All rights reserved.
          </p>
          <hr className="mx-4 hidden h-4 w-[1px] border-l border-neutral-400 md:inline-block" />
          <p>Payments collected via Eversend.</p>
        </div>
      </div>
    </footer>
  );
}
