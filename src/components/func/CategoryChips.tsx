import { FC } from "react";

import { cn } from "@/helpers/utils";
import type { Category } from "@/api/domains/categories";

type Props = {
  categories: Category[];
  selectedId: number | null;
  onSelect: (categoryId: number | null) => void;
  isLoading: boolean;
};

export const CategoryChips: FC<Props> = ({
  categories,
  selectedId,
  onSelect,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[72px]">
            <div className="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse" />
            <div className="w-12 h-3 rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(selectedId === cat.id ? null : cat.id)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[72px]"
        >
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors border",
              selectedId === cat.id
                ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]"
                : "bg-white border-gray-200"
            )}
          >
            {cat.imageUrl ? (
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="w-10 h-10 object-contain"
              />
            ) : (
              <span className="text-2xl">
                {cat.name.charAt(0)}
              </span>
            )}
          </div>
          <span
            className={cn(
              "text-xs font-medium text-center leading-tight line-clamp-2",
              selectedId === cat.id ? "text-[var(--color-primary)]" : "text-gray-700"
            )}
          >
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
};
