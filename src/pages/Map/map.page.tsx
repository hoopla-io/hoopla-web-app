import { FC, useEffect, useRef, useState } from "react";
import { MapPin, X, ChevronRight, LocateFixed } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useShops, type Shop } from "@/api/hooks/shops.hook";
import { formatDistance } from "@/components/func/ShopCard";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";
import { useUserLocation } from "@/hooks/useUserLocation";

const YANDEX_MAP_API_KEY = "b0a85c0f-823e-4474-a498-9ae4c02da06f";
const BRAND_COLOR = "#8d0b41";

declare global {
  interface Window {
    ymaps: any;
  }
}

function loadYandexMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.ymaps) {
      window.ymaps.ready(resolve);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAP_API_KEY}&lang=en_US`;
    script.onload = () => window.ymaps.ready(resolve);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function createPinSvg(color: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="${color}"/>
      <circle cx="18" cy="18" r="8" fill="white"/>
    </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg.trim());
}

export const MapPage: FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const { location: userLocation, refresh: refreshLocation, refreshing: isRefreshingLocation } = useUserLocation();
  const [mapReady, setMapReady] = useState(false);
  const navigate = useNavigate();

  const { shops, isLoading } = useShops({
    latitude: userLocation?.lat,
    longitude: userLocation?.lng,
  });

  // Initialize map
  useEffect(() => {
    if (!userLocation || !mapContainerRef.current) return;

    let cancelled = false;

    loadYandexMaps().then(() => {
      if (cancelled || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }

      const map = new window.ymaps.Map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 13,
        controls: ["zoomControl", "geolocationControl"],
      });

      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [userLocation]);

  // Add placemarks when shops load
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || shops.length === 0) return;

    const map = mapInstanceRef.current;
    map.geoObjects.removeAll();

    const pinIcon = createPinSvg(BRAND_COLOR);

    shops.forEach((shop) => {
      const placemark = new window.ymaps.Placemark(
        [shop.location.lat, shop.location.lng],
        {
          hintContent: shop.name,
        },
        {
          iconLayout: "default#image",
          iconImageHref: pinIcon,
          iconImageSize: [36, 48],
          iconImageOffset: [-18, -48],
        }
      );

      placemark.events.add("click", () => {
        setSelectedShop(shop);
        map.setCenter([shop.location.lat, shop.location.lng], 15, {
          duration: 300,
        });
      });

      map.geoObjects.add(placemark);
    });
  }, [mapReady, shops]);

  if (!userLocation) {
    return (
      <LoadingScreen
        header="Finding your location"
        description="Loading the map..."
      />
    );
  }

  return (
    <Page>
      <div className="fixed inset-0 top-[64px] bottom-[60px]">
        {/* Map */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Refresh location button */}
        <button
          onClick={refreshLocation}
          disabled={isRefreshingLocation}
          className="absolute top-4 right-4 z-10 p-2.5 bg-white rounded-full shadow-md text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <LocateFixed
            size={20}
            className={isRefreshingLocation ? "animate-pulse" : ""}
          />
        </button>

        {isLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-2 shadow-md text-sm text-gray-600 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[var(--color-primary)] rounded-full animate-spin" />
            Loading cafes...
          </div>
        )}

        {/* Selected shop card */}
        {selectedShop && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl shadow-lg overflow-hidden">
            <button
              onClick={() => setSelectedShop(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/5 hover:bg-black/10 transition-colors z-10"
            >
              <X size={18} className="text-gray-500" />
            </button>
            <AspectRatio ratio={3 / 1}>
              <img
                src={selectedShop.pictureUrl}
                alt={selectedShop.name}
                className="w-full h-full object-cover"
              />
            </AspectRatio>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {selectedShop.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500">
                    <MapPin size={16} />
                    <span>{formatDistance(selectedShop.distance)}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/shops/${selectedShop.shopId}`)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  Details
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
};
