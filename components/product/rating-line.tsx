import clsx from "clsx";
import { StarRating } from "./star-rating";

export function RatingLine({
  rating,
  count,
  className,
}: {
  rating: number;
  count: number;
  className?: string;
}) {
  if (!count) {
    return null;
  }

  return (
    <div className={clsx("flex items-center gap-1.5", className)}>
      <StarRating rating={rating} size="sm" />
      <span className="text-xs text-neutral-500">({count})</span>
    </div>
  );
}
