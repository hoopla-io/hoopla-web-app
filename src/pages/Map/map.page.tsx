import { FC, useEffect, useRef, useState } from "react";
import { MapPin, X, ChevronRight, LocateFixed } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAllShops, type Shop } from "@/api/hooks/shops.hook";
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

export const MapPage: FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // `map` (state) drives the marker effect; `mapInstanceRef` mirrors it so the
  // cleanup can destroy the instance directly — a setState updater isn't a
  // reliable place for that side effect (React may skip it on unmount).
  const mapInstanceRef = useRef<any>(null);
  const [map, setMap] = useState<any>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const { location: userLocation, refresh: refreshLocation, refreshing: isRefreshingLocation } = useUserLocation();
  const navigate = useNavigate();

  const { shops, isLoading } = useAllShops({
    latitude: userLocation?.lat,
    longitude: userLocation?.lng,
  });

  // Initialize the map. The instance lives in state (not a ref) so the marker
  // effect below re-runs whenever the map is rebuilt — fixing the race where
  // pins were added to a map instance that was about to be destroyed, leaving
  // the freshly-built map empty.
  useEffect(() => {
    if (!userLocation || !mapContainerRef.current) return;

    let cancelled = false;

    loadYandexMaps().then(() => {
      if (cancelled || !mapContainerRef.current) return;

      const instance = new window.ymaps.Map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 13,
        controls: ["zoomControl", "geolocationControl"],
      });

      // Location changed again before the async load finished — discard.
      if (cancelled) {
        instance.destroy();
        return;
      }

      mapInstanceRef.current = instance;
      setMap(instance);
    });

    return () => {
      cancelled = true;
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
      setMap(null);
    };
  }, [userLocation]);

  // (Re)draw every shop marker whenever the map is rebuilt or the shops change.
  useEffect(() => {
    if (!map || shops.length === 0) return;

    map.geoObjects.removeAll();

    // Custom pin: each partner's logo sits inside a branded teardrop badge.
    const PinLayout = window.ymaps.templateLayoutFactory.createClass(
      `<div style="position: relative; width: 44px; height: 53px; transform: translate(-22px, -53px);">
         <div style="position: absolute; top: 0; left: 0; width: 44px; height: 44px; border-radius: 50%; background: #fff; border: 3px solid ${BRAND_COLOR}; box-shadow: 0 3px 8px rgba(0,0,0,0.25); box-sizing: border-box; display: flex; align-items: center; justify-content: center; overflow: hidden;">
           <img src="$[properties.logoUrl]" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'" />
         </div>
         <div style="position: absolute; top: 40px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 10px solid ${BRAND_COLOR};"></div>
       </div>`
    );

    shops.forEach((shop) => {
      const placemark = new window.ymaps.Placemark(
        [shop.location.lat, shop.location.lng],
        {
          hintContent: shop.name,
          logoUrl: shop.logoUrl || shop.pictureUrl,
        },
        {
          iconLayout: PinLayout,
          // Keep the clickable area aligned with the round logo badge.
          iconShape: {
            type: "Circle",
            coordinates: [0, -31],
            radius: 22,
          },
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
  }, [map, shops]);

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
      {/* Sits between the floating glass header (~76px) and bottom nav (~76px),
          plus Telegram's safe-area insets when running fullscreen. */}
      <div className="fixed inset-0 top-[calc(72px+var(--tg-top-inset,0px))] bottom-[calc(84px+var(--tg-bottom-inset,0px))]">
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
