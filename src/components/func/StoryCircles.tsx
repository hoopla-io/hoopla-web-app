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
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[100px] h-[100px] rounded-3xl bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (stories.length === 0) return null;

  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-3">
      {stories.map((story, index) => (
        <button
          key={story.id}
          onClick={() => onStoryClick(index)}
          className={`flex-shrink-0 p-[2.5px] rounded-3xl ${
            story.isSeen
              ? "bg-gray-300"
              : "bg-[var(--color-primary)]"
          }`}
        >
          <div className="p-[2px] rounded-[21px] bg-white">
            <img
              src={story.coverImageUrl}
              alt={story.title}
              className="w-[88px] h-[88px] rounded-[19px] object-cover"
            />
          </div>
        </button>
      ))}
    </div>
  );
};
