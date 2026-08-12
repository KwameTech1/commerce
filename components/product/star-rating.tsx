import { StarIcon } from "@heroicons/react/20/solid";

export function StarRating({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const percent = Math.max(0, Math.min(100, (rating / 5) * 100));
  const starClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <span
      className="relative inline-flex"
      aria-label={`Rated ${rating} out of 5 stars`}
    >
      <span className="flex text-neutral-300 dark:text-neutral-600">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} className={`${starClass} shrink-0`} />
        ))}
      </span>
      <span
        className="absolute inset-0 flex overflow-hidden text-amber-400"
        style={{ width: `${percent}%` }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} className={`${starClass} shrink-0`} />
        ))}
      </span>
    </span>
  );
}
