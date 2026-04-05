import { FC } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Coffee } from "lucide-react";

import { useShops } from "@/api/hooks/shops.hook";
import { usePartnerBanners } from "@/api/hooks/banners.hook";
import { useUserLocation } from "@/hooks/useUserLocation";
import ShopCard from "@/components/func/ShopCard";
import { BannerCarousel } from "@/components/func/BannerCarousel";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";
import type { Banner } from "@/api/domains/banners";

export const PartnerDetailPage: FC = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const numericPartnerId = Number(partnerId);

  const { location: userLocation } = useUserLocation();
  const { banners, isLoading: bannersLoading } = usePartnerBanners(numericPartnerId);
  const { shops: allShops, isLoading: shopsLoading } = useShops({
    latitude: userLocation?.lat,
    longitude: userLocation?.lng,
  });

  const partnerShops = allShops.filter(
    (shop) => shop.partnerId === numericPartnerId
  );

  const partnerName = partnerShops[0]?.name?.replace(/\s*\(.*\)$/, "") ?? "Partner";

  const handleBannerClick = (banner: Banner) => {
    switch (banner.linkType) {
      case "url":
        window.open(banner.linkValue, "_blank");
        break;
      case "partner":
        navigate(`/partners/${banner.linkValue}`);
        break;
      case "drink":
        // Drink links need a shop context; navigate to first shop if available
        if (partnerShops.length > 0) {
          navigate(`/shops/${partnerShops[0].shopId}`);
        }
        break;
    }
  };

  if (!userLocation || shopsLoading) {
    return (
      <LoadingScreen
        header="Loading partner"
        description="Please wait..."
      />
    );
  }

  return (
    <Page>
      <div className="max-w-lg mx-auto px-4 pt-4 pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{partnerName}</h1>
        </div>

        {/* Partner banners */}
        <BannerCarousel
          banners={banners}
          isLoading={bannersLoading}
          onBannerClick={handleBannerClick}
        />

        {/* Shops list */}
        {partnerShops.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
            {partnerShops.map((shop) => (
              <ShopCard key={shop.shopId} shop={shop} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Coffee size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No locations found nearby
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              This partner has no shops near your location
            </p>
          </div>
        )}
      </div>
    </Page>
  );
};
