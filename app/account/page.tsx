"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { toast } from "sonner";
import type { Order, User } from "lib/types";
import { getOrdersForUser, markOrderPaid } from "lib/persistence/orders";
import { EVERSEND_PAYMENT_TAG_URL, IS_DEFAULT_PAYMENT_TAG } from "lib/config";
import {
  AUTH_EVENT,
  MIN_PASSWORD_LENGTH,
  changePassword,
  deleteAccount,
  getCurrentUser,
  logout,
  updateProfile,
} from "lib/persistence/users";

const statusStyles: Record<Order["status"], string> = {
  pending_payment:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

const statusLabels: Record<Order["status"], string> = {
  pending_payment: "Pending payment",
  paid: "Paid",
  cancelled: "Cancelled",
};

const inputClasses =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount));
}

function PendingPaymentPanel({
  order,
  onPaid,
}: {
  order: Order;
  onPaid: () => void;
}) {
  const [reference, setReference] = useState("");

  const confirm = () => {
    markOrderPaid(order.id, reference.trim() || undefined);
    toast.success("Payment confirmed. Thank you!");
    onPaid();
  };

  return (
    <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      {IS_DEFAULT_PAYMENT_TAG ? (
        <p className="mb-3 text-xs font-medium">
          Note: the store&apos;s payment tag is not configured — this demo link
          does not lead to a real payment page. Set{" "}
          <code className="rounded bg-white/60 px-1 dark:bg-black/40">
            EVERSEND_PAYMENT_TAG_URL
          </code>{" "}
          in <code>.env.local</code>.
        </p>
      ) : null}
      <div className="overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
        <iframe
          src={EVERSEND_PAYMENT_TAG_URL}
          title={`Payment page for order ${order.id}`}
          className="h-[60vh] min-h-[420px] w-full"
        />
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={confirm}
          className="flex-1 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-black hover:opacity-90"
        >
          I&apos;ve completed payment
        </button>
        <a
          href={EVERSEND_PAYMENT_TAG_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Open payment page in new tab
        </a>
      </div>
      <div className="mt-3">
        <label
          htmlFor={`payment-ref-${order.id}`}
          className="mb-1 block text-xs font-medium"
        >
          Eversend reference (optional)
        </label>
        <input
          id={`payment-ref-${order.id}`}
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          className={inputClasses}
        />
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const current = getCurrentUser();
      setUser(current);
      setOrders(current ? getOrdersForUser(current.id) : []);
      if (current) {
        setProfileName(current.name);
        setProfileEmail(current.email);
      }
    };

    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <h1 className="mb-4 text-3xl font-bold">Your account</h1>
        <p className="mb-8 text-sm text-neutral-500">
          Sign in to view your orders and account details.
        </p>
        <Link
          href="/login"
          className="rounded-full bg-amber-400 px-6 py-3 text-sm font-medium text-black hover:opacity-90"
        >
          Sign in
        </Link>
        <p className="mt-4 text-sm text-neutral-500">
          New here?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    );
  }

  const signOut = () => {
    logout();
    setUser(null);
    setOrders([]);
    toast("Signed out.");
  };

  const saveProfile = async () => {
    setProfileError(null);
    const result = await updateProfile(user.id, {
      name: profileName,
      email: profileEmail,
    });

    if (!result.ok) {
      setProfileError(result.error);
      return;
    }

    setUser(result.user);
    toast.success("Profile updated.");
  };

  const submitPasswordChange = async () => {
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    const result = await changePassword(user.id, currentPassword, newPassword);

    if (!result.ok) {
      setPasswordError(result.error);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated.");
  };

  const removeAccount = () => {
    const confirmed = window.confirm(
      "Delete your account? Your order history will be kept without your personal details, and you will be signed out.",
    );

    if (!confirmed) {
      return;
    }

    deleteAccount(user.id);
    setUser(null);
    setOrders([]);
    toast("Your account has been deleted.");
    router.push("/login");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hello, {user.name}</h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
        <button
          onClick={signOut}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Sign out
        </button>
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="mb-4 text-lg font-semibold">Profile</h2>
          <form action={saveProfile} className="space-y-4">
            <div>
              <label
                htmlFor="profile-name"
                className="mb-1 block text-sm font-medium"
              >
                Name
              </label>
              <input
                id="profile-name"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label
                htmlFor="profile-email"
                className="mb-1 block text-sm font-medium"
              >
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={profileEmail}
                onChange={(event) => setProfileEmail(event.target.value)}
                className={inputClasses}
              />
            </div>
            {profileError ? (
              <p className="text-sm text-red-600">{profileError}</p>
            ) : null}
            <button
              type="submit"
              className="rounded-full bg-amber-400 px-6 py-2 text-sm font-medium text-black hover:opacity-90"
            >
              Save profile
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="mb-4 text-lg font-semibold">Security</h2>
          <form action={submitPasswordChange} className="space-y-4">
            <div>
              <label
                htmlFor="current-password"
                className="mb-1 block text-sm font-medium"
              >
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label
                htmlFor="new-password"
                className="mb-1 block text-sm font-medium"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                minLength={MIN_PASSWORD_LENGTH}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className={inputClasses}
              />
              <p className="mt-1 text-xs text-neutral-500">
                At least {MIN_PASSWORD_LENGTH} characters.
              </p>
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1 block text-sm font-medium"
              >
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                minLength={MIN_PASSWORD_LENGTH}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={inputClasses}
              />
            </div>
            {passwordError ? (
              <p className="text-sm text-red-600">{passwordError}</p>
            ) : null}
            <button
              type="submit"
              className="rounded-full bg-amber-400 px-6 py-2 text-sm font-medium text-black hover:opacity-90"
            >
              Update password
            </button>
          </form>
        </section>
      </div>

      <section className="mb-10 rounded-lg border border-red-200 p-5 dark:border-red-900">
        <h2 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-400">
          Danger zone
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          Deleting your account removes your personal details. Your order
          history is kept without them, so receipts stay viewable.
        </p>
        <button
          onClick={removeAccount}
          className="rounded-full border border-red-300 px-6 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          Delete my account
        </button>
      </section>

      <h2 className="mb-4 text-xl font-semibold">Your orders</h2>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 p-8 text-center dark:border-neutral-800">
          <p className="mb-4 text-neutral-500">
            You haven&apos;t placed any orders yet.
          </p>
          <Link
            href="/search"
            className="rounded-full bg-amber-400 px-6 py-3 text-sm font-medium text-black hover:opacity-90"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{order.id}</p>
                  <p className="text-xs text-neutral-500">
                    {new Intl.DateTimeFormat(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).format(new Date(order.createdAt))}
                  </p>
                </div>
                <span
                  className={clsx(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    statusStyles[order.status],
                  )}
                >
                  {statusLabels[order.status]}
                </span>
              </div>
              <ul className="mb-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                {order.items.map((item) => (
                  <li key={item.merchandiseId} className="flex justify-between">
                    <span>
                      {item.title}
                      {item.variantTitle !== "Default Title"
                        ? ` (${item.variantTitle})`
                        : ""}{" "}
                      × {item.quantity}
                    </span>
                    <span>
                      {formatMoney(item.price.amount, item.price.currencyCode)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-right text-sm font-semibold">
                Total:{" "}
                {formatMoney(order.total.amount, order.total.currencyCode)}
              </p>
              {order.paymentRef ? (
                <p className="text-xs text-neutral-500">
                  Payment reference:{" "}
                  <span className="font-medium">{order.paymentRef}</span>
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {order.status === "pending_payment" ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setPayingOrderId(
                          payingOrderId === order.id ? null : order.id,
                        )
                      }
                      className="inline-block rounded-full bg-amber-400 px-4 py-2 text-xs font-medium text-black hover:opacity-90"
                    >
                      {payingOrderId === order.id
                        ? "Close payment panel"
                        : "Pay now"}
                    </button>
                    <a
                      href={EVERSEND_PAYMENT_TAG_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
                    >
                      Open payment page in new tab
                    </a>
                  </>
                ) : null}
                <Link
                  href={`/confirmation/${order.id}`}
                  className="inline-block rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  View receipt
                </Link>
              </div>
              {order.status === "pending_payment" &&
              payingOrderId === order.id ? (
                <PendingPaymentPanel
                  order={order}
                  onPaid={() => {
                    setPayingOrderId(null);
                    setOrders(getOrdersForUser(user.id));
                  }}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
