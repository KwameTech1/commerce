import { redirect } from "next/navigation";
import { getCart } from "lib/cart";
import { CheckoutForm } from "components/checkout/checkout-form";

export const metadata = {
  title: "Checkout",
  description: "Review your order and pay through our payment link.",
};

export default async function CheckoutPage() {
  const cart = await getCart();

  if (!cart || cart.lines.length === 0) {
    redirect("/search");
  }

  return <CheckoutForm cart={cart} />;
}
