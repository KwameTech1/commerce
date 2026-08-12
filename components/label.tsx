import clsx from "clsx";
import Price from "./price";
import { StarIcon } from "@heroicons/react/20/solid";

const Label = ({
  title,
  amount,
  currencyCode,
  position = "bottom",
  rating,
  ratingCount,
}: {
  title: string;
  amount: string;
  currencyCode: string;
  position?: "bottom" | "center";
  rating?: number;
  ratingCount?: number;
}) => {
  return (
    <div
      className={clsx(
        "absolute bottom-0 left-0 flex w-full px-4 pb-4 @container/label",
        {
          "lg:px-20 lg:pb-[35%]": position === "center",
        },
      )}
    >
      <div className="flex items-center rounded-full border bg-white/70 p-1 text-xs font-semibold text-black backdrop-blur-md dark:border-neutral-800 dark:bg-black/70 dark:text-white">
        {ratingCount && ratingCount > 0 ? (
          <div className="mb-0.5 flex items-center gap-1 px-2">
            <StarIcon className="h-3 w-3 text-amber-400" />
            <span className="leading-none">{rating?.toFixed(1)}</span>
            <span className="font-normal text-neutral-500">
              ({ratingCount})
            </span>
          </div>
        ) : null}
        <h3 className="mr-4 line-clamp-2 grow pl-2 leading-none tracking-tight">
          {title}
        </h3>
        <Price
          className="flex-none rounded-full bg-amber-400 p-2 text-black"
          amount={amount}
          currencyCode={currencyCode}
          currencyCodeClassName="hidden @[275px]/label:inline"
        />
      </div>
    </div>
  );
};

export default Label;
