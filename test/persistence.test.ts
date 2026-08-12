import { beforeEach, describe, expect, it } from "vitest";

import {
  createOrder,
  getOrder,
  getOrders,
  getOrdersForUser,
  markOrderPaid,
} from "lib/persistence/orders";
import { getUserReviews, addUserReview } from "lib/persistence/reviews";
import {
  getWishlist,
  isWishlisted,
  mergeGuestWishlist,
  setWishlist,
  toggleWishlistItem,
} from "lib/persistence/wishlist";
import { readStorage, writeStorage } from "lib/persistence/storage";
import {
  AUTH_EVENT,
  changePassword,
  deleteAccount,
  getUsers,
  loginUser,
  logout,
  registerUser,
  setCurrentUser,
  updateProfile,
} from "lib/persistence/users";
import { products } from "lib/data/products";

function fakeCart() {
  const product = products[0]!;
  const variant = product.variants[0]!;
  return {
    lines: [
      {
        quantity: 2,
        cost: {
          totalAmount: { amount: variant.price.amount, currencyCode: "GHS" },
        },
        merchandise: {
          id: variant.id,
          title: variant.title,
          selectedOptions: variant.selectedOptions,
          product: {
            id: product.id,
            handle: product.handle,
            title: product.title,
            featuredImage: product.featuredImage,
          },
        },
      },
    ],
    cost: {
      subtotalAmount: {
        amount: (Number(variant.price.amount) * 2).toFixed(2),
        currencyCode: "GHS",
      },
      totalAmount: {
        amount: (Number(variant.price.amount) * 2).toFixed(2),
        currencyCode: "GHS",
      },
      totalTaxAmount: { amount: "0.00", currencyCode: "GHS" },
    },
    totalQuantity: 2,
  };
}

describe("localStorage persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("falls back to the default for missing or corrupt values", () => {
    expect(readStorage<string[]>("missing", [])).toEqual([]);
    localStorage.setItem("corrupt", "{this is not json");
    expect(readStorage("corrupt", "fallback")).toBe("fallback");
  });

  it("round-trips values through storage", () => {
    writeStorage("data", { a: 1 });
    expect(readStorage("data", null)).toEqual({ a: 1 });
  });
});

describe("users", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("registers and logs in with a salted hash", async () => {
    const registered = await registerUser({
      name: "Ama",
      email: "Ama@Example.com",
      password: "secret123",
    });
    expect(registered.ok).toBe(true);
    if (!registered.ok) return;

    expect(registered.user.email).toBe("ama@example.com");
    expect(registered.user.passwordHash).toMatch(/^v2:[A-Za-z0-9+/]+=/);

    const login = await loginUser("ama@example.com", "secret123");
    expect(login.ok).toBe(true);

    const wrong = await loginUser("ama@example.com", "nope");
    expect(wrong.ok).toBe(false);
  });

  it("rejects duplicate emails and empty input", async () => {
    const first = await registerUser({
      name: "Amy",
      email: "a@b.co",
      password: "secret123",
    });
    expect(first.ok).toBe(true);
    const duplicate = await registerUser({
      name: "Bee",
      email: "A@b.co",
      password: "secret123",
    });
    expect(duplicate.ok).toBe(false);
    const empty = await registerUser({
      name: " ",
      email: "c@d.co",
      password: "",
    });
    expect(empty.ok).toBe(false);
  });

  it("rejects invalid emails, short names and short passwords", async () => {
    const badEmail = await registerUser({
      name: "Ama",
      email: "not-an-email",
      password: "secret123",
    });
    expect(badEmail.ok).toBe(false);

    const shortName = await registerUser({
      name: "A",
      email: "ama@example.com",
      password: "secret123",
    });
    expect(shortName.ok).toBe(false);

    const shortPassword = await registerUser({
      name: "Ama",
      email: "ama@example.com",
      password: "short",
    });
    expect(shortPassword.ok).toBe(false);
  });

  it("updates the profile name and email", async () => {
    const registered = await registerUser({
      name: "Ama",
      email: "ama@example.com",
      password: "secret123",
    });
    if (!registered.ok) throw new Error("expected registration to succeed");

    const updated = await updateProfile(registered.user.id, {
      name: "Ama Boateng",
      email: "ama.new@example.com",
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;

    expect(updated.user.name).toBe("Ama Boateng");
    expect(updated.user.email).toBe("ama.new@example.com");
    expect(getUsers().find((u) => u.id === registered.user.id)?.name).toBe(
      "Ama Boateng",
    );
  });

  it("rejects profile updates with duplicate or invalid emails", async () => {
    await registerUser({
      name: "Ama",
      email: "ama@example.com",
      password: "secret123",
    });
    const second = await registerUser({
      name: "Kofi",
      email: "kofi@example.com",
      password: "secret123",
    });
    if (!second.ok) throw new Error("expected registration to succeed");

    const duplicate = await updateProfile(second.user.id, {
      name: "Kofi",
      email: "ama@example.com",
    });
    expect(duplicate.ok).toBe(false);

    const invalid = await updateProfile(second.user.id, {
      name: "Kofi",
      email: "bad",
    });
    expect(invalid.ok).toBe(false);

    const missing = await updateProfile("unknown", {
      name: "X Y",
      email: "x@y.co",
    });
    expect(missing.ok).toBe(false);
  });

  it("changes the password and rejects a wrong current one", async () => {
    const registered = await registerUser({
      name: "Ama",
      email: "ama@example.com",
      password: "secret123",
    });
    if (!registered.ok) throw new Error("expected registration to succeed");
    const id = registered.user.id;

    const wrongCurrent = await changePassword(
      id,
      "not-my-password",
      "newsecret1",
    );
    expect(wrongCurrent.ok).toBe(false);

    const shortNew = await changePassword(id, "secret123", "short");
    expect(shortNew.ok).toBe(false);

    const success = await changePassword(id, "secret123", "newsecret1");
    expect(success.ok).toBe(true);

    expect((await loginUser("ama@example.com", "secret123")).ok).toBe(false);
    expect((await loginUser("ama@example.com", "newsecret1")).ok).toBe(true);
  });

  it("deletes the account, clears the session and detaches orders", async () => {
    const registered = await registerUser({
      name: "Ama",
      email: "ama@example.com",
      password: "secret123",
    });
    if (!registered.ok) throw new Error("expected registration to succeed");
    const id = registered.user.id;

    setCurrentUser(id);
    createOrder(
      fakeCart(),
      {
        fullName: "A",
        email: "a@b.co",
        phone: "1",
        address: "S",
        city: "C",
        country: "G",
      },
      id,
    );

    deleteAccount(id);

    expect(getUsers().length).toBe(0);
    expect(readStorage("current-user-id", null)).toBeNull();
    const orders = getOrders();
    expect(orders.length).toBe(1);
    expect(orders[0]!.userId).toBeNull();
  });

  it("notifies listeners when the session changes", () => {
    let events = 0;
    const listener = () => {
      events += 1;
    };

    window.addEventListener(AUTH_EVENT, listener);
    setCurrentUser("u-1");
    logout();
    window.removeEventListener(AUTH_EVENT, listener);

    expect(events).toBe(2);
  });

  it("logs in legacy demo hashes and upgrades them to salted v2", async () => {
    const users = getUsers();
    const legacy = {
      id: "u-legacy",
      name: "Old",
      email: "old@example.com",
      passwordHash: "demo",
      createdAt: new Date().toISOString(),
    };
    legacy.passwordHash = (() => {
      let hash = 5381;
      const password = "legacy-pass";
      for (let i = 0; i < password.length; i++) {
        hash = (hash * 33) ^ password.charCodeAt(i);
      }
      return `demo-${(hash >>> 0).toString(36)}`;
    })();
    users.push(legacy);
    writeStorage("users", users);

    const login = await loginUser("old@example.com", "legacy-pass");
    expect(login.ok).toBe(true);
    if (!login.ok) return;

    const upgraded = getUsers().find((u) => u.id === legacy.id);
    expect(upgraded?.passwordHash).toMatch(/^v2:/);
    expect(await loginUser("old@example.com", "legacy-pass")).toEqual(
      expect.objectContaining({ ok: true }),
    );
  });

  it("tracks the current session", () => {
    setCurrentUser("u-1");
    expect(readStorage("current-user-id", null)).toBe("u-1");
    setCurrentUser(null);
    expect(readStorage("current-user-id", null)).toBeNull();
  });
});

describe("orders", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates, lists and filters orders by user", () => {
    const cart = fakeCart();
    const shipping = {
      fullName: "Ama",
      email: "ama@example.com",
      phone: "020 123 4567",
      address: "12 Main St",
      city: "Accra",
      country: "Ghana",
    };

    const anon = createOrder(cart, shipping, null);
    expect(anon.status).toBe("pending_payment");
    expect(anon.paymentRef).toBe("");
    expect(anon.userId).toBeNull();

    const mine = createOrder(cart, shipping, "u-1");
    expect(getOrders().length).toBe(2);
    const mine2 = createOrder(cart, shipping, "u-1");
    expect(getOrdersForUser("u-1").length).toBe(2);
    expect(getOrdersForUser("u-1")[0]!.id).toBe(mine2.id);
    expect(getOrdersForUser("u-2")).toEqual([]);
  });

  it("marks an order paid by id and captures the reference", () => {
    const order = createOrder(
      fakeCart(),
      {
        fullName: "A",
        email: "a@b.co",
        phone: "1",
        address: "S",
        city: "C",
        country: "G",
      },
      null,
    );

    const marked = markOrderPaid(order.id, "EVS-123");
    expect(marked?.status).toBe("paid");
    expect(marked?.paymentRef).toBe("EVS-123");
    expect(getOrder(order.id)?.updatedAt).toBe(marked?.updatedAt);

    expect(markOrderPaid("missing")).toBeUndefined();
    expect(getOrder("missing")).toBeUndefined();
  });

  it("keeps the paymentRef unchanged when marking paid without one", () => {
    const order = createOrder(
      fakeCart(),
      {
        fullName: "A",
        email: "a@b.co",
        phone: "1",
        address: "S",
        city: "C",
        country: "G",
      },
      "u-1",
    );
    markOrderPaid(order.id);
    const paid = getOrder(order.id);
    expect(paid?.status).toBe("paid");
    expect(paid?.paymentRef).toBe("");
  });
});

describe("reviews", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("accumulates user reviews per product handle", () => {
    const first = addUserReview("headphones", {
      author: "Ama",
      rating: 4,
      title: "Great",
      body: "Works well",
    });
    expect(first.length).toBe(1);

    const added = addUserReview("headphones", {
      author: "Kofi",
      rating: 5,
      title: "Love it",
      body: "Excellent",
    });
    expect(added.length).toBe(2);
    expect(added[0]!.author).toBe("Kofi");

    expect(getUserReviews("other-product")).toEqual([]);
    expect(getUserReviews("headphones").length).toBe(2);
  });
});

describe("wishlist", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("toggles handles on and off", () => {
    expect(getWishlist()).toEqual([]);
    expect(toggleWishlistItem("headphones")).toEqual(["headphones"]);
    expect(isWishlisted("headphones")).toBe(true);
    expect(toggleWishlistItem("headphones")).toEqual([]);
    expect(isWishlisted("headphones")).toBe(false);
  });

  it("sets the whole list and filters out junk", () => {
    setWishlist(["a", "b"]);
    expect(getWishlist()).toEqual(["a", "b"]);
    writeStorage("wishlist", [42, "c", null]);
    expect(getWishlist()).toEqual(["c"]);
  });

  it("separates the guest wishlist from signed-in users", async () => {
    toggleWishlistItem("guest-item");

    const registered = await registerUser({
      name: "Ama",
      email: "ama@example.com",
      password: "secret123",
    });
    if (!registered.ok) throw new Error("expected registration to succeed");

    setCurrentUser(registered.user.id);
    expect(getWishlist()).toEqual([]);
    toggleWishlistItem("user-item");
    expect(getWishlist()).toEqual(["user-item"]);

    logout();
    expect(getWishlist()).toEqual(["guest-item"]);

    setCurrentUser(registered.user.id);
    expect(getWishlist()).toEqual(["user-item"]);
  });

  it("merges the guest wishlist into the account on sign-in", async () => {
    toggleWishlistItem("a");
    toggleWishlistItem("b");

    const registered = await registerUser({
      name: "Ama",
      email: "ama@example.com",
      password: "secret123",
    });
    if (!registered.ok) throw new Error("expected registration to succeed");

    const merged = mergeGuestWishlist(registered.user.id);
    expect(merged).toEqual(["a", "b"]);

    expect(getWishlist()).toEqual([]);

    setCurrentUser(registered.user.id);
    expect(getWishlist()).toEqual(["a", "b"]);

    logout();
    expect(getWishlist()).toEqual([]);
  });
});
