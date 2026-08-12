import { readStorage, writeStorage } from "./storage";

const NEWSLETTER_KEY = "newsletter-subscribers";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getSubscribers(): string[] {
  const list = readStorage<string[]>(NEWSLETTER_KEY, []);
  return Array.isArray(list)
    ? list.filter((entry): entry is string => typeof entry === "string")
    : [];
}

export function isSubscribed(email: string): boolean {
  return getSubscribers().includes(email.trim().toLowerCase());
}

export function subscribe(
  email: string,
): { ok: true } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalized)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const subscribers = getSubscribers();

  if (subscribers.includes(normalized)) {
    return { ok: false, error: "You're already subscribed." };
  }

  subscribers.push(normalized);
  writeStorage(NEWSLETTER_KEY, subscribers);
  return { ok: true };
}
