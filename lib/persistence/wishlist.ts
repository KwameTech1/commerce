import { readStorage, removeStorage, writeStorage } from "./storage";
import { getCurrentUser } from "./users";

const GUEST_KEY = "wishlist";

function wishlistKey(userId: string | null): string {
  return userId ? `wishlist-${userId}` : GUEST_KEY;
}

function sanitize(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function getWishlist(): string[] {
  const user = getCurrentUser();
  return sanitize(readStorage<string[]>(wishlistKey(user?.id ?? null), []));
}

export function isWishlisted(handle: string): boolean {
  return getWishlist().includes(handle);
}

export function toggleWishlistItem(handle: string): string[] {
  const user = getCurrentUser();
  const key = wishlistKey(user?.id ?? null);
  const handles = sanitize(readStorage<string[]>(key, []));
  const index = handles.indexOf(handle);

  if (index >= 0) {
    handles.splice(index, 1);
  } else {
    handles.push(handle);
  }

  writeStorage(key, handles);
  return handles;
}

export function setWishlist(handles: string[]): void {
  const user = getCurrentUser();
  writeStorage(wishlistKey(user?.id ?? null), handles);
}

export function mergeGuestWishlist(userId: string): string[] {
  const guest = sanitize(readStorage<string[]>(GUEST_KEY, []));
  const own = sanitize(readStorage<string[]>(wishlistKey(userId), []));
  const merged = [...guest, ...own].filter(
    (handle, index, all) => all.indexOf(handle) === index,
  );

  removeStorage(GUEST_KEY);
  writeStorage(wishlistKey(userId), merged);
  return merged;
}
