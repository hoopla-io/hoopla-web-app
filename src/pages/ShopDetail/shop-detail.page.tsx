import { FC, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Phone,
  Globe,
  Instagram,
  ArrowLeft,
  Coffee,
  ChevronRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { useShop, useShopDrinks } from "@/api/hooks/shops.hook";
import { useValidateOrder } from "@/api/hooks/orders.hook";
import { usePartnerBanners } from "@/api/hooks/banners.hook";
import { useAuth } from "@/context/auth.context";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";
import { BannerCarousel } from "@/components/func/BannerCarousel";
import { formatBalance, cn } from "@/helpers/utils";
import type { SelectedModifier } from "@/api/domains/orders";
import type { Banner } from "@/api/domains/banners";

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
  const { isAuthenticated } = useAuth();
  const validateOrder = useValidateOrder();
  const [validatingDrinkId, setValidatingDrinkId] = useState<number | null>(null);

  const numericShopIdFromParams = Number(shopId);

  const { shopDetail, isLoading } = useShop({
    shopId: numericShopIdFromParams,
  });

  const { categories: drinkCategories, isLoading: drinksLoading } =
    useShopDrinks(numericShopIdFromParams);

  const { banners, isLoading: bannersLoading } = usePartnerBanners(
    shopDetail.partnerId ?? 0
  );

  const handleBannerClick = (banner: Banner) => {
    switch (banner.linkType) {
      case "url":
        window.open(banner.linkValue, "_blank");
        break;
      case "drink":
        handleDrinkClick(Number(banner.linkValue));
        break;
      case "partner":
        navigate(`/partners/${banner.linkValue}`);
        break;
    }
  };

  const handleDrinkClick = (drinkId: number) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const numericShopId = Number(shopId);
    setValidatingDrinkId(drinkId);

    validateOrder.mutate(
      { drinkId, shopId: numericShopId },
      {
        onSuccess: (data) => {
          setValidatingDrinkId(null);

          const modifications = data.modifications ?? {};
          const modKeys = Object.keys(modifications);

          // Check if any modification group has multiple options
          const needsModifierSelection = modKeys.some(
            (key) =>
              Array.isArray(modifications[key]) &&
              modifications[key].length > 1
          );

          if (needsModifierSelection) {
            navigate(`/shops/${numericShopId}/order/modifiers`, {
              state: { validatedOrder: data },
            });
          } else {
            // Auto-select single modifiers
            const autoSelectedModifiers: SelectedModifier[] = modKeys
              .filter(
                (key) =>
                  Array.isArray(modifications[key]) &&
                  modifications[key].length === 1
              )
              .map((key) => {
                const mod = modifications[key][0];
                return {
                  modifierGroupId: String(mod.modificationGroupId ?? key),
                  modifierId: String(mod.modificationId ?? ""),
                  modifierKey: String(mod.modificationKey ?? key),
                  modifierPrice: mod.modificationPrice ?? 0,
                  modifierName: mod.modificationName ?? "",
                };
              });

            navigate(`/shops/${numericShopId}/order/receipt`, {
              state: {
                validatedOrder: data,
                selectedModifiers: autoSelectedModifiers,
              },
            });
          }
        },
        onError: () => {
          setValidatingDrinkId(null);
          toast.error("Failed to validate order. Please try again.");
        },
      }
    );
  };

  const { categories, hasRealCategories, allDrinks } = useMemo(() => {
    const cats = drinkCategories.map((c) => c.name);
    const hasReal = drinkCategories.some(
      (c) => c.name && c.name.toLowerCase() !== "other"
    );
    const flat = drinkCategories.flatMap((c) => c.drinks);

    return {
      categories: hasReal ? cats : [],
      hasRealCategories: hasReal,
      allDrinks: flat,
    };
  }, [drinkCategories]);

  const [activeCategory, setActiveCategory] = useState<string>("");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const handleTabClick = (cat: string) => {
    setActiveCategory(cat);
    const el = sectionRefs.current[cat];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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

        <div className="pt-4 px-2 space-y-5">
          <h1 className="text-2xl font-bold text-gray-900">
            {shopDetail.name}
          </h1>

          {/* Info card */}
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
                      {url.urlType === "instagram" ? "Instagram" : "Website"}
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

          {/* Partner banners */}
          {banners.length > 0 && (
            <div className="px-4">
              <BannerCarousel
                banners={banners}
                isLoading={bannersLoading}
                onBannerClick={handleBannerClick}
              />
            </div>
          )}

          {/* Menu */}
          {(drinksLoading || allDrinks.length > 0) && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Menu
              </h2>

              {drinksLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
                </div>
              ) : (
                <>
                  {hasRealCategories && (
                    <div
                      className="flex gap-2 overflow-x-auto pb-3 mb-1 scrollbar-hide sticky top-[64px] z-[5] bg-[#f5f5f5] pt-4 px-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]"
                    >
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          data-tab={cat}
                          onClick={() => handleTabClick(cat)}
                          className={cn(
                            "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                            activeCategory === cat
                              ? "bg-[var(--color-primary)] text-white"
                              : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {hasRealCategories ? (
                    <div className="space-y-6 px-4">
                      {drinkCategories.map((cat) => (
                        <div
                          key={cat.id}
                          ref={(el) => {
                            sectionRefs.current[cat.name] = el;
                          }}
                          data-category={cat.name}
                          className="scroll-mt-[120px]"
                        >
                          <h3 className="text-lg font-bold text-gray-900 mb-3">
                            {cat.name}
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {cat.drinks.map((drink) => (
                              <DrinkCard
                                key={drink.id}
                                drink={drink}
                                onOrderClick={handleDrinkClick}
                                isValidating={validatingDrinkId === drink.id}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {allDrinks.map((drink) => (
                        <DrinkCard
                          key={drink.id}
                          drink={drink}
                          onOrderClick={handleDrinkClick}
                          isValidating={validatingDrinkId === drink.id}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};

function DrinkCard({
  drink,
  onOrderClick,
  isValidating,
}: {
  drink: {
    id: number;
    name: string;
    pictureUrl: string | null;
    productPrice: number;
  };
  onOrderClick: (drinkId: number) => void;
  isValidating: boolean;
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
      onClick={() => !isValidating && onOrderClick(drink.id)}
    >
      {drink.pictureUrl ? (
        <AspectRatio ratio={1}>
          <img
            src={drink.pictureUrl}
            alt={drink.name}
            className="w-full h-full object-cover"
          />
        </AspectRatio>
      ) : (
        <AspectRatio ratio={1}>
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Coffee size={32} className="text-gray-400" />
          </div>
        </AspectRatio>
      )}
      <div className="p-2.5 flex items-end justify-between">
        <div>
          <h3 className="font-medium text-sm text-gray-900 leading-tight">
            {drink.name}
          </h3>
          <p className="text-sm font-semibold text-[var(--color-primary)] mt-1">
            {formatPrice(drink.productPrice)}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
          {isValidating ? (
            <Loader2 size={16} className="text-white animate-spin" />
          ) : (
            <ChevronRight size={16} className="text-white" />
          )}
        </div>
      </div>
    </div>
  );
}
