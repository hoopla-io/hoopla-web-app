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
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 h-9 w-20 rounded-full bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
          selectedId === null
            ? "bg-[var(--color-primary)] text-white"
            : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            selectedId === cat.id
              ? "bg-[var(--color-primary)] text-white"
              : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
          )}
        >
          {cat.imageUrl && (
            <img
              src={cat.imageUrl}
              alt={cat.name}
              className="w-4 h-4 rounded-full object-cover"
            />
          )}
          {cat.name}
        </button>
      ))}
    </div>
  );
};
