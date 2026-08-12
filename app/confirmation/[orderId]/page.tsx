"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import clsx from "clsx";
import type { Order } from "lib/types";
import { getOrder } from "lib/persistence/orders";

const statusStyles: Record<Order["status"], string> = {
  pending_payment:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount));
}

export default function ConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const [ready, setReady] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    setOrder(getOrder(params.orderId) ?? null);
    setReady(true);
  }, [params.orderId]);

  if (!ready) {
    return null;
  }

  if (!order) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <h1 className="mb-4 text-3xl font-bold">Order not found</h1>
        <p className="mb-8 text-sm text-neutral-500">
          We couldn&apos;t find this order. Orders are stored in this
          browser&apos;s local storage.
        </p>
        <Link
          href="/account"
          className="rounded-full bg-amber-400 px-6 py-3 text-sm font-medium text-black hover:opacity-90"
        >
          Go to your account
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div
        className={clsx(
          "mb-6 rounded-lg border p-6",
          order.status === "paid"
            ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950"
            : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
        )}
      >
        <h1 className="mb-2 text-2xl font-bold">
          {order.status === "paid"
            ? "Thank you for your purchase"
            : "Order placed"}
        </h1>
        <p className="text-sm">
          Order <span className="font-semibold">{order.id}</span> —{" "}
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              statusStyles[order.status],
            )}
          >
            {order.status === "paid" ? "Paid" : "Pending payment"}
          </span>
        </p>
        {order.status === "pending_payment" ? (
          <a
            href="https://eversend.me/maxcards"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-full bg-amber-400 px-4 py-2 text-xs font-medium text-black hover:opacity-90"
          >
            Complete payment
          </a>
        ) : null}
        {order.paymentRef ? (
          <p className="mt-3 text-xs text-neutral-500">
            Payment reference:{" "}
            <span className="font-medium">{order.paymentRef}</span>
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
        <ul className="mb-4 space-y-3">
          {order.items.map((item) => (
            <li key={item.merchandiseId} className="flex items-center gap-3">
              <div className="relative h-14 w-14 flex-none overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
                {item.image?.url ? (
                  <Image
                    src={item.image.url}
                    alt={item.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{item.title}</p>
                <p className="text-neutral-500">
                  {item.variantTitle !== "Default Title"
                    ? `${item.variantTitle} × ${item.quantity}`
                    : `× ${item.quantity}`}
                </p>
              </div>
              <p className="text-sm">
                {formatMoney(item.price.amount, item.price.currencyCode)}
              </p>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-neutral-200 pt-3 text-sm dark:border-neutral-700">
          <p className="flex justify-between">
            <span className="text-neutral-500">Subtotal</span>
            <span>
              {formatMoney(order.subtotal.amount, order.subtotal.currencyCode)}
            </span>
          </p>
          <p className="flex justify-between font-semibold">
            <span>Total</span>
            <span>
              {formatMoney(order.total.amount, order.total.currencyCode)}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 p-5 text-sm dark:border-neutral-800">
        <h2 className="mb-2 text-lg font-semibold">Shipping to</h2>
        <p className="font-medium">{order.shipping.fullName}</p>
        <p className="text-neutral-500">
          {order.shipping.address}, {order.shipping.city},{" "}
          {order.shipping.country}
        </p>
        <p className="text-neutral-500">
          {order.shipping.email} · {order.shipping.phone}
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-500">
        Orders and receipts live in this browser&apos;s local storage.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/account"
          className="flex-1 rounded-full bg-amber-400 px-6 py-3 text-center text-sm font-medium text-black hover:opacity-90"
        >
          Go to your account
        </Link>
        <Link
          href="/search"
          className="flex-1 rounded-full border border-neutral-300 px-6 py-3 text-center text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
