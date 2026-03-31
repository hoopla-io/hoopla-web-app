import { FC } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Phone,
  Globe,
  Instagram,
  ArrowLeft,
} from "lucide-react";

import { useShop } from "@/api/hooks/shops.hook";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";
import { formatBalance } from "@/helpers/utils";

function formatWorkingHours(
  hours: { weekDay: string; openAt: string; closeAt: string }[]
): string {
  const today = new Date()
    .toLocaleString("en-US", { weekday: "long" })
    .toLowerCase();
  const todayHours = hours.find((h) => h.weekDay === today);
  if (!todayHours) return "Closed today";
  return `${todayHours.openAt} - ${todayHours.closeAt}`;
}

function formatPrice(price: number): string {
  return formatBalance(price) + " UZS";
}

export const ShopDetailPage: FC = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const { shopDetail, isLoading } = useShop({
    shopId: Number(shopId),
  });

  if (isLoading || !shopDetail?.name) {
    return (
      <LoadingScreen header="Loading cafe" description="Please wait..." />
    );
  }

  return (
    <Page>
      <div className="max-w-lg mx-auto pb-28">
        {/* Hero image */}
        <div className="relative">
          <AspectRatio ratio={480 / 320}>
            <img
              src={
                shopDetail.pictures.length > 0
                  ? shopDetail.pictures[0].pictureUrl
                  : shopDetail.pictureUrl
              }
              alt={shopDetail.name!}
              className="w-full h-full object-cover"
            />
          </AspectRatio>
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
        </div>

        <div className="pt-4 space-y-5">
          <h1 className="text-2xl font-bold text-gray-900">
            {shopDetail.name}
          </h1>

          <div className="bg-white rounded-sm shadow-sm py-4 space-y-3">
            {shopDetail.workingHours.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Today's hours</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatWorkingHours(shopDetail.workingHours)}
                  </p>
                </div>
              </div>
            )}

            {shopDetail.location && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-[var(--color-primary)]" />
                </div>
                <a
                  href={`https://yandex.uz/maps/?ll=${shopDetail.location.lng},${shopDetail.location.lat}&z=16&mode=whatshere&whatshere[point]=${shopDetail.location.lng},${shopDetail.location.lat}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  Open in Yandex Maps
                </a>
              </div>
            )}

            {shopDetail.phoneNumbers.map((phone, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-[var(--color-primary)]" />
                </div>
                <a
                  href={`tel:+${phone.phoneNumber}`}
                  className="text-sm font-medium text-gray-900"
                >
                  +{phone.phoneNumber}
                </a>
              </div>
            ))}

            {shopDetail.urls.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                  {shopDetail.urls[0].urlType === "instagram" ? (
                    <Instagram
                      size={18}
                      className="text-[var(--color-primary)]"
                    />
                  ) : (
                    <Globe
                      size={18}
                      className="text-[var(--color-primary)]"
                    />
                  )}
                </div>
                <div className="flex gap-3">
                  {shopDetail.urls.map((url, i) => (
                    <a
                      key={i}
                      href={url.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {url.urlType === "instagram"
                        ? "Instagram"
                        : "Website"}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Gallery */}
          {shopDetail.pictures.length > 1 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Photos
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {shopDetail.pictures.map((pic, i) => (
                  <img
                    key={i}
                    src={pic.pictureUrl}
                    alt={`${shopDetail.name} ${i + 1}`}
                    className="w-32 h-24 rounded-xl object-cover flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Drinks */}
          {shopDetail.drinks && shopDetail.drinks.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Menu
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {shopDetail.drinks.map((drink) => (
                  <div
                    key={drink.id}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden"
                  >
                    <AspectRatio ratio={1}>
                      <img
                        src={drink.pictureUrl}
                        alt={drink.name}
                        className="w-full h-full object-cover"
                      />
                    </AspectRatio>
                    <div className="p-2.5">
                      <h3 className="font-medium text-sm text-gray-900 leading-tight">
                        {drink.name}
                      </h3>
                      <p className="text-sm font-semibold text-[var(--color-primary)] mt-1">
                        {formatPrice(drink.productPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};
