import Link from "next/link";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { getCart } from "lib/cart";
import { CheckoutForm } from "components/checkout/checkout-form";

export const metadata = {
  title: "Checkout",
  description: "Review your order and pay through our payment link.",
};

export default async function CheckoutPage() {
  const cart = await getCart();

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <ShoppingCartIcon className="mb-4 h-16 w-16 text-neutral-300" />
        <h1 className="mb-4 text-3xl font-bold">Your cart is empty</h1>
        <p className="mb-8 text-sm text-neutral-500">
          Add some products to your cart and come back here to check out.
        </p>
        <Link
          href="/search"
          className="rounded-full bg-amber-400 px-6 py-3 text-sm font-medium text-black hover:opacity-90"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return <CheckoutForm cart={cart} />;
}
