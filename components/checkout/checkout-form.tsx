"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EVERSEND_PAYMENT_TAG_URL, IS_DEFAULT_PAYMENT_TAG } from "lib/config";
import type { Cart, Order } from "lib/types";
import { createOrder, markOrderPaid } from "lib/persistence/orders";
import { getCurrentUser } from "lib/persistence/users";
import { clearCartAfterOrder } from "./actions";

type Stage = "shipping" | "payment";

type ShippingForm = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

const emptyShipping: ShippingForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
};

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount));
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldLabels: Record<keyof ShippingForm, string> = {
  fullName: "your name",
  email: "an email address",
  phone: "a phone number",
  address: "a street address",
  city: "a city",
  country: "a country",
};

function validateShipping(shipping: ShippingForm): string | null {
  const missing = (
    ["fullName", "email", "phone", "address", "city", "country"] as const
  ).find((field) => !shipping[field].trim());

  if (missing) {
    return `Please enter ${fieldLabels[missing]}.`;
  }

  if (!EMAIL_PATTERN.test(shipping.email.trim())) {
    return "Please enter a valid email address.";
  }

  if (shipping.phone.replace(/\D/g, "").length < 7) {
    return "Please enter a valid phone number.";
  }

  return null;
}

export function CheckoutForm({ cart }: { cart: Cart }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("shipping");
  const [order, setOrder] = useState<Order | null>(null);
  const [shipping, setShipping] = useState<ShippingForm>(emptyShipping);
  const [paymentRef, setPaymentRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  const updateShipping = (field: keyof ShippingForm, value: string) => {
    setShipping((current) => ({ ...current, [field]: value }));
  };

  const placeOrder = async () => {
    if (cart.lines.length === 0) {
      return;
    }

    const validationError = validateShipping(shipping);

    if (validationError) {
      setError(validationError);
      return;
    }

    const user = getCurrentUser();
    const created = createOrder(
      cart,
      {
        ...shipping,
        fullName: shipping.fullName.trim(),
        email: shipping.email.trim(),
        phone: shipping.phone.trim(),
        address: shipping.address.trim(),
        city: shipping.city.trim(),
        country: shipping.country.trim(),
      },
      user?.id ?? null,
    );
    await clearCartAfterOrder();
    setOrder(created);
    setError(null);
    setStage("payment");
  };

  const confirmPayment = () => {
    if (order) {
      markOrderPaid(order.id, paymentRef.trim() || undefined);
      toast.success("Payment confirmed. Thank you!");
      router.push(`/confirmation/${order.id}`);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 lg:flex-row">
      <div className="flex-1">
        {stage === "shipping" ? (
          <>
            <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
            <form action={placeOrder} className="space-y-4">
              {[
                ["fullName", "Full name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["address", "Street address"],
                ["city", "City"],
                ["country", "Country"],
              ].map(([field, label]) => (
                <div key={field}>
                  <label
                    htmlFor={field}
                    className="mb-1 block text-sm font-medium"
                  >
                    {label}
                  </label>
                  <input
                    id={field}
                    name={field}
                    type={field === "email" ? "email" : "text"}
                    required
                    value={shipping[field as keyof ShippingForm]}
                    onChange={(event) =>
                      updateShipping(
                        field as keyof ShippingForm,
                        event.target.value,
                      )
                    }
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
              ))}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button
                type="submit"
                className="w-full rounded-full bg-amber-400 p-4 text-sm font-medium tracking-wide text-black hover:opacity-90"
              >
                Place order
              </button>
              <p className="text-center text-xs text-neutral-500">
                You will be redirected to our payment page to complete the
                purchase.
              </p>
            </form>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-bold">Complete your payment</h1>
            <p className="mb-4 text-sm text-neutral-500">
              Pay securely through our payment page. Once you have paid, click
              the button below to confirm your order.
            </p>
            {IS_DEFAULT_PAYMENT_TAG ? (
              <div className="mb-4 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
                <p className="font-semibold">
                  The store&apos;s payment tag is not configured yet.
                </p>
                <p className="mt-1 text-neutral-600 dark:text-neutral-300">
                  The link below is a demo placeholder and does not lead to a
                  real payment page. Set{" "}
                  <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-900">
                    EVERSEND_PAYMENT_TAG_URL
                  </code>{" "}
                  in <code>.env.local</code> to your Eversend tag (see{" "}
                  <code>.env.example</code>).
                </p>
              </div>
            ) : null}
            <div className="overflow-hidden rounded-lg border border-neutral-300 dark:border-neutral-700">
              <iframe
                src={EVERSEND_PAYMENT_TAG_URL}
                title="Payment page"
                className="h-[60vh] min-h-[420px] w-full"
              />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={confirmPayment}
                className="flex-1 rounded-full bg-green-600 p-4 text-sm font-medium tracking-wide text-black hover:opacity-90"
              >
                I&apos;ve completed payment
              </button>
              <a
                href={EVERSEND_PAYMENT_TAG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center rounded-full border border-neutral-300 p-4 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Open payment page in new tab
              </a>
            </div>
            <div className="mt-4">
              <label
                htmlFor="paymentRef"
                className="mb-1 block text-sm font-medium"
              >
                Eversend reference (optional)
              </label>
              <input
                id="paymentRef"
                name="paymentRef"
                type="text"
                autoComplete="off"
                placeholder="e.g. the confirmation code from the payment page"
                value={paymentRef}
                onChange={(event) => setPaymentRef(event.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <p className="mt-3 text-center text-xs text-neutral-500">
              If the payment page does not load inside this box, use the new tab
              link above.
            </p>
          </>
        )}
      </div>

      <aside className="w-full lg:w-96">
        <div className="rounded-lg border border-neutral-300 p-4 dark:border-neutral-700">
          <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
          <ul className="mb-4 max-h-72 space-y-3 overflow-y-auto">
            {cart.lines.map((line) => (
              <li key={line.merchandise.id} className="flex items-center gap-3">
                <div className="relative h-14 w-14 flex-none overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
                  <Image
                    src={line.merchandise.product.featuredImage.url}
                    alt={line.merchandise.product.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium">
                    {line.merchandise.product.title}
                  </p>
                  <p className="text-neutral-500">
                    {line.merchandise.title} × {line.quantity}
                  </p>
                </div>
                <p className="text-sm">
                  {formatMoney(
                    line.cost.totalAmount.amount,
                    line.cost.totalAmount.currencyCode,
                  )}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-sm dark:border-neutral-700">
            <span className="font-medium">Total</span>
            <span className="text-base font-semibold">
              {formatMoney(
                cart.cost.totalAmount.amount,
                cart.cost.totalAmount.currencyCode,
              )}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
