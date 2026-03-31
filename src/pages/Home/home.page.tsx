import { FC, useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Loader2, Coffee } from "lucide-react";
import debounce from "lodash/debounce";

import { useShops } from "@/api/hooks/shops.hook";
import ShopCard from "@/components/func/ShopCard";
import { Input } from "@/components/ui/input";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";

const DEFAULT_LAT = 41.2995;
const DEFAULT_LNG = 69.2401;

export const HomePage: FC = () => {
  const [searchText, setSearchText] = useState("");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        }
      );
    } else {
      setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
    }
  }, []);

  const { shops, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useShops({
      latitude: userLocation?.lat,
      longitude: userLocation?.lng,
      name: searchText,
    });

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchText(value);
    }, 400),
    []
  );

  const handleClear = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    setSearchText("");
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
      <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
        {/* Search */}
        <div className="sticky top-[72px] z-[5] bg-[#f5f5f5] pb-3 pt-1">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              ref={searchInputRef}
              onChange={(e) => debouncedSearch(e.target.value)}
              placeholder="Search cafes..."
              className="h-12 pl-10 pr-10 rounded-xl bg-white border-none shadow-sm text-base"
            />
            {searchText && (
              <button
                onClick={handleClear}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Section title */}
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          {searchText ? "Search Results" : "Nearby Cafes"}
        </h2>

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
