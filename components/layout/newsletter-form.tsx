"use client";

import { useState } from "react";
import { toast } from "sonner";
import { subscribe } from "lib/persistence/newsletter";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const result = subscribe(email);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setEmail("");
    setError(null);
    toast.success("Subscribed! You'll hear from us soon.");
  };

  return (
    <div className="mx-auto max-w-md">
      <h3 className="mb-2 font-semibold text-black dark:text-white">
        Stay in the loop
      </h3>
      <p className="mb-4 text-sm text-neutral-500">
        Get the latest products and offers, straight to your inbox.
      </p>
      <form action={submit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="you@example.com"
          aria-label="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
        />
        <button
          type="submit"
          className="flex-none rounded-full bg-amber-400 px-5 py-2 text-sm font-medium text-black hover:bg-amber-300"
        >
          Subscribe
        </button>
      </form>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
