import type { Cart, Order } from "lib/types";
import { readStorage, writeStorage } from "./storage";

const ORDERS_KEY = "orders";

let lastOrderTimestamp = 0;

export function createOrder(
  cart: Cart,
  shipping: Order["shipping"],
  userId: string | null,
): Order {
  const orders = readStorage<Order[]>(ORDERS_KEY, []);
  const nowMs = Date.now();
  const timestamp = nowMs > lastOrderTimestamp ? nowMs : lastOrderTimestamp + 1;
  lastOrderTimestamp = timestamp;
  const now = new Date(timestamp).toISOString();

  const order: Order = {
    id: `MC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    userId,
    status: "pending_payment",
    items: cart.lines.map((line) => ({
      merchandiseId: line.merchandise.id,
      handle: line.merchandise.product.handle,
      title: line.merchandise.product.title,
      variantTitle: line.merchandise.title,
      quantity: line.quantity,
      price: line.cost.totalAmount,
      image: line.merchandise.product.featuredImage,
    })),
    subtotal: cart.cost.subtotalAmount,
    total: cart.cost.totalAmount,
    shipping,
    paymentRef: "",
    createdAt: now,
    updatedAt: now,
  };

  orders.push(order);
  writeStorage(ORDERS_KEY, orders);
  return order;
}

export function getOrders(): Order[] {
  return readStorage<Order[]>(ORDERS_KEY, []);
}

export function getOrdersForUser(userId: string): Order[] {
  return getOrders()
    .filter((order) => order.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOrder(orderId: string): Order | undefined {
  return getOrders().find((order) => order.id === orderId);
}

export function detachOrdersFromUser(userId: string): void {
  const orders = getOrders();
  let changed = false;

  for (const order of orders) {
    if (order.userId === userId) {
      order.userId = null;
      order.updatedAt = new Date().toISOString();
      changed = true;
    }
  }

  if (changed) {
    writeStorage(ORDERS_KEY, orders);
  }
}

export function markOrderPaid(
  orderId: string,
  paymentRef?: string,
): Order | undefined {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return undefined;
  }

  order.status = "paid";
  if (paymentRef) {
    order.paymentRef = paymentRef;
  }
  order.updatedAt = new Date().toISOString();
  writeStorage(ORDERS_KEY, orders);
  return order;
}
