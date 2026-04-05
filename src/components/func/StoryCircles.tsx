import { FC } from "react";

import type { StoryGroup } from "@/api/domains/stories";

type Props = {
  stories: StoryGroup[];
  isLoading: boolean;
  onStoryClick: (index: number) => void;
};

export const StoryCircles: FC<Props> = ({ stories, isLoading, onStoryClick }) => {
  if (isLoading) {
    return (
      <div
        className="flex gap-3 overflow-x-auto pb-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-[56px] h-[56px] rounded-full bg-gray-200 animate-pulse" />
            <div className="w-10 h-2.5 rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (stories.length === 0) return null;

  return (
    <div
      className="flex gap-3 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {stories.map((story, index) => (
        <button
          key={story.id}
          onClick={() => onStoryClick(index)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0"
        >
          <div
            className={`p-[2.5px] rounded-full ${
              story.isSeen
                ? "bg-gray-300"
                : "bg-gradient-to-br from-[var(--color-primary)] to-amber-500"
            }`}
          >
            <div className="p-[2px] rounded-full bg-white">
              <img
                src={story.coverImageUrl}
                alt={story.title}
                className={`w-[48px] h-[48px] rounded-full object-cover ${
                  story.isSeen ? "opacity-60" : ""
                }`}
              />
            </div>
          </div>
          <span className="text-[11px] text-gray-600 max-w-[56px] truncate">
            {story.title}
          </span>
        </button>
      ))}
    </div>
  );
};
