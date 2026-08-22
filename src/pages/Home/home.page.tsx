import { FC, useEffect, useRef, useState } from "react";
import { Loader2, Coffee, LocateFixed } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useShops } from "@/api/hooks/shops.hook";
import { useCategories } from "@/api/hooks/categories.hook";
import { useMainBanners } from "@/api/hooks/banners.hook";
import { useStoryList } from "@/api/hooks/stories.hook";
import { useActiveOrders } from "@/api/hooks/orders.hook";
import ShopCard from "@/components/func/ShopCard";
import { CategoryChips } from "@/components/func/CategoryChips";
import { CurrentOrdersCarousel } from "@/components/func/CurrentOrdersCarousel";
import { BannerCarousel } from "@/components/func/BannerCarousel";
import { StoryCircles } from "@/components/func/StoryCircles";
import { StoryViewer } from "@/components/func/StoryViewer";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useSearch } from "@/context/search.context";
import type { Banner } from "@/api/domains/banners";

export const HomePage: FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null);
  const navigate = useNavigate();
  // Search is driven from the header overlay (see Header.tsx / SearchContext).
  const { searchText, isSearchOpen } = useSearch();
  const { location: userLocation, refresh: refreshLocation, refreshing: isRefreshingLocation } = useUserLocation();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { banners, isLoading: bannersLoading } = useMainBanners();
  const { stories, isLoading: storiesLoading } = useStoryList();
  const { activeOrders } = useActiveOrders();
  const observerRef = useRef<HTMLDivElement>(null);

  const { shops, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useShops({
      latitude: userLocation?.lat,
      longitude: userLocation?.lng,
      name: searchText,
      categoryId: selectedCategoryId ?? undefined,
    });

  const handleBannerClick = (banner: Banner) => {
    switch (banner.linkType) {
      case "url":
        window.open(banner.linkValue, "_blank");
        break;
      case "partner":
        navigate(`/partners/${banner.linkValue}`);
        break;
    }
  };

  useEffect(() => {
    if (!observerRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!userLocation) {
    return (
      <LoadingScreen
        header="Finding your location"
        description="Getting nearby cafes for you..."
      />
    );
  }

  return (
    <Page>
      <div className="max-w-lg mx-auto px-4 pt-4 pb-6">
        {!isSearchOpen && (
          <>
            {/* Stories */}
            <StoryCircles
              stories={stories}
              isLoading={storiesLoading}
              onStoryClick={(index) => setStoryViewerIndex(index)}
            />

            {/* Story Viewer */}
            {storyViewerIndex !== null && (
              <StoryViewer
                stories={stories}
                initialIndex={storyViewerIndex}
                onClose={() => setStoryViewerIndex(null)}
              />
            )}

            {/* Banners */}
            <BannerCarousel
              banners={banners}
              isLoading={bannersLoading}
              onBannerClick={handleBannerClick}
            />

            {/* Active orders */}
            <CurrentOrdersCarousel orders={activeOrders} />

            {/* Category filter */}
            <CategoryChips
              categories={categories}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              isLoading={categoriesLoading}
            />
          </>
        )}

        {/* Section title */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {searchText ? "Search Results" : "Nearby Cafes"}
          </h2>
          <button
            onClick={refreshLocation}
            disabled={isRefreshingLocation}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <LocateFixed
              size={20}
              className={isRefreshingLocation ? "animate-pulse" : ""}
            />
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <LoadingScreen
            header="Loading cafes"
            description="Please wait..."
          />
        )}

        {/* Shop list */}
        {!isLoading && shops.length > 0 && (
          <div className="space-y-3">
            {shops.map((shop) => (
              <ShopCard key={shop.shopId} shop={shop} />
            ))}

            {/* Infinite scroll trigger */}
            <div ref={observerRef} className="py-4 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && shops.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Coffee size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No cafes found
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Try a different search term
            </p>
          </div>
        )}
      </div>
    </Page>
  );
};
