import { FC, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, Loader2, ChevronUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useStoryDetail } from "@/api/hooks/stories.hook";
import { StoriesApi } from "@/api/domains/stories";
import type { StoryGroup, StoryItem } from "@/api/domains/stories";

type Props = {
  stories: StoryGroup[];
  initialIndex: number;
  onClose: () => void;
};

const TICK_MS = 50;

export const StoryViewer: FC<Props> = ({ stories, initialIndex, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [groupIndex, setGroupIndex] = useState(initialIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const progressRef = useRef(0);
  const isPausedRef = useRef(false);
  const groupIndexRef = useRef(initialIndex);
  const itemIndexRef = useRef(0);

  const currentStoryId = stories[groupIndex]?.id ?? null;
  const { story, isLoading } = useStoryDetail(currentStoryId);
  const currentItem = story?.items?.[itemIndex] ?? null;
  const totalItems = story?.items?.length ?? 0;

  // Keep refs in sync
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { groupIndexRef.current = groupIndex; }, [groupIndex]);
  useEffect(() => { itemIndexRef.current = itemIndex; }, [itemIndex]);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Prefetch next story group
  useEffect(() => {
    const nextIndex = groupIndex + 1;
    if (nextIndex < stories.length) {
      queryClient.prefetchQuery({
        queryKey: ["stories", "detail", stories[nextIndex].id],
        queryFn: () => StoriesApi.getById(stories[nextIndex].id),
      });
    }
  }, [groupIndex, stories, queryClient]);

  const goNext = useCallback(() => {
    const totalItemsCurrent = story?.items?.length ?? 0;
    if (itemIndexRef.current < totalItemsCurrent - 1) {
      const next = itemIndexRef.current + 1;
      setItemIndex(next);
      itemIndexRef.current = next;
    } else if (groupIndexRef.current < stories.length - 1) {
      const next = groupIndexRef.current + 1;
      setGroupIndex(next);
      groupIndexRef.current = next;
      setItemIndex(0);
      itemIndexRef.current = 0;
    } else {
      onClose();
      return;
    }
    progressRef.current = 0;
    setProgress(0);
  }, [story, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (itemIndexRef.current > 0) {
      const prev = itemIndexRef.current - 1;
      setItemIndex(prev);
      itemIndexRef.current = prev;
    } else if (groupIndexRef.current > 0) {
      const prev = groupIndexRef.current - 1;
      setGroupIndex(prev);
      groupIndexRef.current = prev;
      setItemIndex(0);
      itemIndexRef.current = 0;
    }
    progressRef.current = 0;
    setProgress(0);
  }, []);

  // Auto-advance timer
  useEffect(() => {
    if (isLoading || !currentItem) return;

    const duration = currentItem.duration || 5;
    const increment = (TICK_MS / (duration * 1000)) * 100;

    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      progressRef.current += increment;
      setProgress(progressRef.current);

      if (progressRef.current >= 100) {
        goNext();
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [isLoading, currentItem, goNext]);

  // Reset progress when item changes
  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
  }, [groupIndex, itemIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  // Touch swipe handling
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only handle horizontal swipes (ignore vertical)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) goNext();
      else goPrev();
    }
  };

  const handleItemLink = (item: StoryItem) => {
    if (!item.linkType || !item.linkValue) return;
    switch (item.linkType) {
      case "url":
        window.open(item.linkValue, "_blank");
        break;
      case "partner":
        onClose();
        navigate(`/partners/${item.linkValue}`);
        break;
      case "drink":
        onClose();
        navigate(`/partners/${item.linkValue}`);
        break;
    }
  };

  const getLinkLabel = (linkType: string | null) => {
    switch (linkType) {
      case "partner": return "View Partner";
      case "drink": return "View Drink";
      case "url": return "Learn More";
      default: return "";
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      style={{ height: "100dvh" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
    >
      {/* Progress bars */}
      {totalItems > 0 && (
        <div className="absolute top-3 left-3 right-3 z-[110] flex gap-1">
          {story!.items.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: `${i < itemIndex ? 100 : i === itemIndex ? progress : 0}%`,
                  transition: i === itemIndex ? "none" : undefined,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="absolute top-8 left-3 right-3 z-[110] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={stories[groupIndex]?.coverImageUrl}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-white/30"
          />
          <span className="text-white text-sm font-medium drop-shadow-md">
            {stories[groupIndex]?.title}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1.5 rounded-full bg-black/30 text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Story image */}
      {!isLoading && currentItem && (
        <>
          <img
            src={currentItem.imageUrl}
            alt={currentItem.title ?? ""}
            className="w-full h-full object-contain"
          />

          {/* Bottom content overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-[105]">
            <div className="bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-20 pb-6 px-4">
              {currentItem.title && (
                <h3 className="text-white font-semibold text-lg mb-1 drop-shadow-md">
                  {currentItem.title}
                </h3>
              )}
              {currentItem.description && (
                <p className="text-white/80 text-sm mb-3 drop-shadow-md">
                  {currentItem.description}
                </p>
              )}
              {currentItem.linkType && currentItem.linkValue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemLink(currentItem);
                  }}
                  className="flex items-center gap-1.5 mx-auto px-5 py-2.5 rounded-full bg-white text-gray-900 text-sm font-medium shadow-lg"
                >
                  <ChevronUp size={16} />
                  {getLinkLabel(currentItem.linkType)}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Tap zones (above image, below header) */}
      <div
        className="absolute top-0 left-0 w-1/3 h-full z-[106]"
        onClick={goPrev}
      />
      <div
        className="absolute top-0 right-0 w-2/3 h-full z-[106]"
        onClick={goNext}
      />
    </div>,
    document.body
  );
};
