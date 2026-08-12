import type { Review } from "lib/types";
import { readStorage, writeStorage } from "./storage";

export type NewReview = {
  author: string;
  rating: number;
  title: string;
  body: string;
};

export function getUserReviews(handle: string): Review[] {
  return readStorage<Review[]>(`reviews-${handle}`, []);
}

export function addUserReview(handle: string, review: NewReview): Review[] {
  const reviews = getUserReviews(handle);
  reviews.unshift({
    id: `ur-${Date.now()}`,
    ...review,
    createdAt: new Date().toISOString(),
  });
  writeStorage(`reviews-${handle}`, reviews);
  return reviews;
}
