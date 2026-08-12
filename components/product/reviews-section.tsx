"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Review } from "lib/types";
import { StarRating } from "./star-rating";
import { addUserReview, getUserReviews } from "lib/persistence/reviews";

const ratingLabels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export function ReviewsSection({
  handle,
  reviews,
}: {
  handle: string;
  reviews: Review[];
}) {
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setUserReviews(getUserReviews(handle));
  }, [handle]);

  const allReviews = useMemo(
    () =>
      [...userReviews, ...reviews].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    [userReviews, reviews],
  );

  const average =
    allReviews.length > 0
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) /
        allReviews.length
      : 0;

  const submitReview = () => {
    if (!author.trim() || !body.trim()) {
      toast.error("Please add your name and review text.");
      return;
    }

    const next = addUserReview(handle, {
      author: author.trim(),
      rating,
      title: title.trim() || ratingLabels[rating] || "Great product",
      body: body.trim(),
    });
    setUserReviews(next);
    setAuthor("");
    setTitle("");
    setBody("");
    setRating(5);
    setSubmitted(true);
    toast.success("Thanks! Your review has been added.");
  };

  return (
    <section className="mt-8 rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
      <h2 className="mb-4 text-2xl font-bold">Customer reviews</h2>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl font-bold">{average.toFixed(1)}</span>
        <div>
          <StarRating rating={average} />
          <p className="text-sm text-neutral-500">
            {allReviews.length} {allReviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      <ul className="mb-8 space-y-5">
        {allReviews.map((review) => (
          <li
            key={review.id}
            className="border-b border-neutral-200 pb-5 last:border-b-0 dark:border-neutral-800"
          >
            <div className="mb-1 flex items-center gap-2">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-sm font-semibold">{review.title}</span>
            </div>
            <p className="text-xs text-neutral-500">
              {review.author} ·{" "}
              {new Intl.DateTimeFormat(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              }).format(new Date(review.createdAt))}
            </p>
            <p className="mt-2 text-sm">{review.body}</p>
          </li>
        ))}
        {allReviews.length === 0 ? (
          <li className="text-sm text-neutral-500">
            No reviews yet. Be the first to review this product.
          </li>
        ) : null}
      </ul>

      <h3 className="mb-3 text-lg font-semibold">Write a review</h3>
      {submitted ? (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          Thanks! Your review has been added.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="review-author"
            className="mb-1 block text-sm font-medium"
          >
            Your name
          </label>
          <input
            id="review-author"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label
            htmlFor="review-title"
            className="mb-1 block text-sm font-medium"
          >
            Title
          </label>
          <input
            id="review-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Great product"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Rating</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                className="p-1"
              >
                <StarRating rating={rating >= value ? 5 : 0} />
              </button>
            ))}
            <span className="ml-2 text-sm text-neutral-500">
              {ratingLabels[rating]}
            </span>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="review-body"
            className="mb-1 block text-sm font-medium"
          >
            Review
          </label>
          <textarea
            id="review-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            rows={4}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </div>
      <button
        onClick={submitReview}
        className="mt-4 rounded-full bg-amber-400 px-6 py-3 text-sm font-medium text-black hover:opacity-90"
      >
        Submit review
      </button>
    </section>
  );
}
