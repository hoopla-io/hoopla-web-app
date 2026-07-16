import { FC, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Phone,
  Globe,
  Instagram,
  ArrowLeft,
  Share2,
  Coffee,
  Plus,
  Minus,
  ChevronDown,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { useShop, useShopDrinks } from "@/api/hooks/shops.hook";
import { useValidateOrder } from "@/api/hooks/orders.hook";
import {
  useAddCartItem,
  useClearCart,
  useCart,
  useUpdateCartItemQuantity,
  useRemoveCartItem,
  isCrossShopCartConflict,
} from "@/api/hooks/cart.hook";
import { usePartnerBanners } from "@/api/hooks/banners.hook";
import { useAuth } from "@/context/auth.context";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";
import { BannerCarousel } from "@/components/func/BannerCarousel";
import { ShopStatusBadge } from "@/components/func/ShopStatusBadge";
import { CartConflictDialog } from "@/components/func/CartConflictDialog";
import { DrinkModifierSheet } from "@/components/func/DrinkModifierSheet";
import {
  formatBalance,
  cn,
  getShopOpenStatus,
  type WorkingHour,
} from "@/helpers/utils";
import { shareShop } from "@/helpers/share";
import {
  toSelectedModifier,
  type SelectedModifier,
  type ValidateOrderResponse,
} from "@/api/domains/orders";
import type { Banner } from "@/api/domains/banners";

function formatWorkingHours(hours: WorkingHour[]): string {
  // Reuse the shared helper so the displayed hours and the Open/Closed badge
  // always agree (same case-insensitive weekday lookup).
  const { todayHours } = getShopOpenStatus(hours);
  if (!todayHours) return "Closed today";
  return `${todayHours.openAt} - ${todayHours.closeAt}`;
}

function formatPrice(price: number): string {
  return formatBalance(price) + " UZS";
}

export const ShopDetailPage: FC = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, openLoginModal } = useAuth();
  const validateOrder = useValidateOrder();
  const addCartItem = useAddCartItem();
  const clearCart = useClearCart();
  const { cart } = useCart();
  const updateItemQuantity = useUpdateCartItemQuantity();
  const removeItem = useRemoveCartItem();
  const [validatingDrinkId, setValidatingDrinkId] = useState<number | null>(null);
  const [showCartConflict, setShowCartConflict] = useState(false);
  const [pendingAdd, setPendingAdd] = useState<{
    shopId: number;
    drinkId: number;
    modifiers: SelectedModifier[];
  } | null>(null);
  const [modifierDrink, setModifierDrink] = useState<ValidateOrderResponse | null>(
    null
  );
  const [pendingCartItemIds, setPendingCartItemIds] = useState<Set<number>>(
    new Set()
  );

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
    // One validate/add flow at a time — tapping another drink while one is
    // already in flight would overwrite validatingDrinkId and un-busy the
    // first card mid-flight, so ignore taps until it settles.
    if (validatingDrinkId !== null) return;

    if (!isAuthenticated) {
      // Gate behind the sign-in modal; resume the order on success so the
      // user stays on this page instead of being redirected away.
      openLoginModal(() => proceedToOrder(drinkId));
      return;
    }

    proceedToOrder(drinkId);
  };

  // Drinks with nothing to choose (no modifiers, or every group auto-resolves)
  // go straight into the cart — no separate review screen in between.
  const addDrinkToCart = (
    numericShopId: number,
    drinkId: number,
    modifiers: SelectedModifier[]
  ) => {
    addCartItem.mutate(
      { shopId: numericShopId, drinkId, quantity: 1, modifiers },
      {
        onSuccess: () => toast.success("Added to cart"),
        onError: (err: any) => {
          if (isCrossShopCartConflict(err)) {
            setPendingAdd({ shopId: numericShopId, drinkId, modifiers });
            setShowCartConflict(true);
            return;
          }
          toast.error(
            err?.message ??
              err?.response?.data?.message ??
              "Couldn't add this to your cart. Please try again."
          );
        },
        onSettled: () => setValidatingDrinkId(null),
      }
    );
  };

  const handleClearAndRetry = () => {
    if (!pendingAdd) return;
    clearCart.mutate(undefined, {
      onSuccess: () => {
        setShowCartConflict(false);
        // Show the card busy again during the retried POST; addDrinkToCart's
        // existing onSettled clears it once this second attempt lands.
        setValidatingDrinkId(pendingAdd.drinkId);
        addDrinkToCart(pendingAdd.shopId, pendingAdd.drinkId, pendingAdd.modifiers);
      },
      onError: () => {
        toast.error("Couldn't clear your existing cart. Please try again.");
      },
    });
  };

  // A no-modifier drink maps to exactly one cart line — the one with an empty
  // modifiers array. Modifier drinks always have non-empty modifiers, so they
  // never match and keep showing the plain "+" button.
  const noModifierLineFor = (drinkId: number) =>
    cart?.items.find((it) => it.drinkId === drinkId && it.modifiers.length === 0) ??
    null;

  const addPendingCartItemId = (itemId: number) =>
    setPendingCartItemIds((prev) => new Set(prev).add(itemId));
  const removePendingCartItemId = (itemId: number) =>
    setPendingCartItemIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });

  const handleIncrement = async (line: { id: number; quantity: number }) => {
    addPendingCartItemId(line.id);
    try {
      await updateItemQuantity.mutateAsync({
        itemId: line.id,
        quantity: line.quantity + 1,
      });
    } catch {
      toast.error("Couldn't update your cart. Please try again.");
    } finally {
      removePendingCartItemId(line.id);
    }
  };

  const handleDecrement = async (line: { id: number; quantity: number }) => {
    addPendingCartItemId(line.id);
    try {
      if (line.quantity > 1) {
        await updateItemQuantity.mutateAsync({
          itemId: line.id,
          quantity: line.quantity - 1,
        });
      } else {
        await removeItem.mutateAsync(line.id);
      }
    } catch {
      toast.error("Couldn't update your cart. Please try again.");
    } finally {
      removePendingCartItemId(line.id);
    }
  };

  const proceedToOrder = (drinkId: number) => {
    const numericShopId = Number(shopId);
    setValidatingDrinkId(drinkId);

    validateOrder.mutate(
      { drinkId, shopId: numericShopId },
      {
        onSuccess: (data) => {
          const groups = data.modifierGroups?.length
            ? data.modifierGroups
            : null;

          // Show the modifier page whenever there's a real choice to make:
          // any group with more than one option. Single-option groups are
          // resolved here so trivial drinks skip straight into the cart.
          if (groups) {
            const needsModifierSelection = groups.some(
              (g) => (g.options?.length ?? 0) > 1
            );

            if (needsModifierSelection) {
              setValidatingDrinkId(null);
              setModifierDrink(data);
            } else {
              // Auto-select required single-option groups; optional ones stay
              // empty so we don't force a modifier the customer didn't pick.
              const autoSelectedModifiers: SelectedModifier[] = groups
                .filter(
                  (g) => (g.options?.length ?? 0) === 1 && (g.minSelect ?? 0) >= 1
                )
                .map((g) => toSelectedModifier(g.options[0], g.key));

              addDrinkToCart(numericShopId, drinkId, autoSelectedModifiers);
            }
            return;
          }

          // Legacy path — no group rules; behave exactly as before.
          const modifications = data.modifications ?? {};
          const modKeys = Object.keys(modifications);

          const needsModifierSelection = modKeys.some(
            (key) =>
              Array.isArray(modifications[key]) &&
              modifications[key].length > 1
          );

          if (needsModifierSelection) {
            setValidatingDrinkId(null);
            setModifierDrink(data);
          } else {
            const autoSelectedModifiers: SelectedModifier[] = modKeys
              .filter(
                (key) =>
                  Array.isArray(modifications[key]) &&
                  modifications[key].length === 1
              )
              .map((key) => toSelectedModifier(modifications[key][0], key));

            addDrinkToCart(numericShopId, drinkId, autoSelectedModifiers);
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

  const [infoExpanded, setInfoExpanded] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string>("");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const tabScrollRef = useRef<HTMLDivElement>(null);
  // While a tab tap is smooth-scrolling we suppress the scroll-spy so the active
  // pill doesn't flicker through the intermediate sections it passes over.
  const isClickScrollingRef = useRef(false);
  const clickScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Live intersection state per category, keyed by name (see scroll-spy below).
  const visibilityRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Scroll-spy: highlight the tab for whichever section sits in the band just
  // below the sticky header + category bar as the user scrolls the menu.
  useEffect(() => {
    if (!hasRealCategories || categories.length === 0) return;

    // `el instanceof Element` (not `!== null`) so a not-yet-mounted ref —
    // which reads back as `undefined`, not `null` — can't reach observe() and
    // throw "parameter 1 is not of type 'Element'".
    const sections = categories
      .map((c) => sectionRefs.current[c])
      .filter((el): el is HTMLDivElement => el instanceof Element);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrollingRef.current) return;
        for (const entry of entries) {
          const cat = entry.target.getAttribute("data-category");
          if (cat) visibilityRef.current[cat] = entry.isIntersecting;
        }
        // Topmost (in document order) section currently inside the band wins.
        const firstVisible = categories.find((c) => visibilityRef.current[c]);
        if (firstVisible) setActiveCategory(firstVisible);
      },
      // Active band = from ~72px (the sticky tab bar; the app header is hidden
      // on this page) down to 45% of the viewport, so a section activates as
      // its heading clears the sticky bar.
      { rootMargin: "-72px 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories, hasRealCategories]);

  // Keep the active pill in view by smoothly centering it within the tab strip.
  // We scroll the strip directly (rather than scrollIntoView) so the page never
  // moves vertically and the centering works inside the sticky bar.
  useEffect(() => {
    const container = tabScrollRef.current;
    const btn = tabRefs.current[activeCategory];
    if (!container || !btn) return;

    const offset =
      btn.offsetLeft - (container.clientWidth - btn.clientWidth) / 2;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const left = Math.max(0, Math.min(offset, maxScroll));

    container.scrollTo({ left, behavior: "smooth" });
  }, [activeCategory]);

  useEffect(() => {
    return () => {
      if (clickScrollTimeout.current) clearTimeout(clickScrollTimeout.current);
    };
  }, []);

  const handleTabClick = (cat: string) => {
    setActiveCategory(cat);
    // Suppress scroll-spy until the programmatic smooth scroll settles.
    isClickScrollingRef.current = true;
    if (clickScrollTimeout.current) clearTimeout(clickScrollTimeout.current);
    clickScrollTimeout.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 700);

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
            className="absolute top-[calc(1rem+var(--tg-top-inset,0px))] left-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <button
            onClick={() => shareShop(numericShopIdFromParams, shopDetail.name ?? "")}
            aria-label="Share this cafe"
            className="absolute top-[calc(1rem+var(--tg-top-inset,0px))] right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
          >
            <Share2 size={20} className="text-gray-700" />
          </button>
        </div>

        <div className="pt-4 px-2 space-y-5">
          <h1 className="text-2xl font-bold text-gray-900">
            {shopDetail.name}
          </h1>

          {/* Info card — collapsed by default; the hours row acts as the toggle
              header and the contact details (map, phones, links) expand below. */}
          {(() => {
            const hasInfoDetails =
              Boolean(shopDetail.location) ||
              shopDetail.phoneNumbers.length > 0 ||
              shopDetail.urls.length > 0;

            return (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => hasInfoDetails && setInfoExpanded((v) => !v)}
                  aria-expanded={infoExpanded}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-4 text-left",
                    !hasInfoDetails && "cursor-default"
                  )}
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-[var(--color-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {shopDetail.workingHours.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">Today's hours</p>
                          <ShopStatusBadge workingHours={shopDetail.workingHours} />
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatWorkingHours(shopDetail.workingHours)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">
                        Cafe details
                      </p>
                    )}
                  </div>
                  {hasInfoDetails && (
                    <ChevronDown
                      size={20}
                      className={cn(
                        "text-gray-400 flex-shrink-0 transition-transform duration-300",
                        infoExpanded && "rotate-180"
                      )}
                    />
                  )}
                </button>

                {/* Collapsible details. The grid-rows 0fr→1fr trick animates the
                    height smoothly without measuring a fixed pixel value. While
                    collapsed, `inert` + aria-hidden keep the hidden links out of
                    the tab order and the accessibility tree. */}
                {hasInfoDetails && (
                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      infoExpanded
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div
                      className="overflow-hidden"
                      aria-hidden={!infoExpanded}
                      {...(!infoExpanded ? ({ inert: "" } as Record<string, string>) : {})}
                    >
                      <div className="px-4 pb-4 pt-3 space-y-3 border-t border-gray-100">
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
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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
              {drinksLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
                </div>
              ) : (
                <>
                  {hasRealCategories && (
                    // Floating glass pill row that docks at the very top — the
                    // app header is hidden on this page, so the bar sits right
                    // below the Telegram top inset. -mx-2 cancels the parent
                    // px-2 so the pill spans the same max-w-lg edges; px-3 is the
                    // side inset. Outer is click-through so taps in the margins
                    // reach the content scrolling behind.
                    <div className="pointer-events-none sticky top-[var(--tg-top-inset,0px)] z-20 -mx-2 px-3 pt-2 pb-2">
                      <div
                        ref={tabScrollRef}
                        className="pointer-events-auto relative flex gap-2 overflow-x-auto scrollbar-hide rounded-[24px] bg-white/80 px-2 py-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.3)] ring-1 ring-black/[0.06] backdrop-blur-2xl"
                      >
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            data-tab={cat}
                            ref={(el) => {
                              tabRefs.current[cat] = el;
                            }}
                            onClick={() => handleTabClick(cat)}
                            className={cn(
                              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                              activeCategory === cat
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-gray-500/5 text-gray-600 hover:bg-gray-500/10"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
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
                          className="scroll-mt-[calc(72px+var(--tg-top-inset,0px))]"
                        >
                          <h3 className="text-lg font-bold text-gray-900 mb-3">
                            {cat.name}
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {cat.drinks.map((drink) => {
                              const cartLine = noModifierLineFor(drink.id);
                              return (
                                <DrinkCard
                                  key={drink.id}
                                  drink={drink}
                                  onOrderClick={handleDrinkClick}
                                  isValidating={validatingDrinkId === drink.id}
                                  cartLine={cartLine}
                                  onIncrement={() =>
                                    cartLine && handleIncrement(cartLine)
                                  }
                                  onDecrement={() =>
                                    cartLine && handleDecrement(cartLine)
                                  }
                                  stepperPending={pendingCartItemIds.has(
                                    cartLine?.id ?? -1
                                  )}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {allDrinks.map((drink) => {
                        const cartLine = noModifierLineFor(drink.id);
                        return (
                          <DrinkCard
                            key={drink.id}
                            drink={drink}
                            onOrderClick={handleDrinkClick}
                            isValidating={validatingDrinkId === drink.id}
                            cartLine={cartLine}
                            onIncrement={() => cartLine && handleIncrement(cartLine)}
                            onDecrement={() => cartLine && handleDecrement(cartLine)}
                            stepperPending={pendingCartItemIds.has(
                              cartLine?.id ?? -1
                            )}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <CartConflictDialog
        open={showCartConflict}
        onOpenChange={setShowCartConflict}
        onConfirm={handleClearAndRetry}
        isPending={clearCart.isPending}
      />

      <DrinkModifierSheet
        validatedOrder={modifierDrink}
        shopId={numericShopIdFromParams}
        onClose={() => setModifierDrink(null)}
        onAdded={() => {
          setModifierDrink(null);
          toast.success("Added to cart");
        }}
      />
    </Page>
  );
};

function DrinkCard({
  drink,
  onOrderClick,
  isValidating,
  cartLine,
  onIncrement,
  onDecrement,
  stepperPending,
}: {
  drink: {
    id: number;
    name: string;
    pictureUrl: string | null;
    productPrice: number;
  };
  onOrderClick: (drinkId: number) => void;
  isValidating: boolean;
  cartLine?: { id: number; quantity: number } | null;
  onIncrement?: () => void;
  onDecrement?: () => void;
  stepperPending?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm overflow-hidden transition-transform",
        cartLine ? "" : "active:scale-[0.98] cursor-pointer"
      )}
      onClick={() => {
        // A no-modifier drink already in the cart has nothing left to
        // configure — only the stepper below can act on it.
        if (cartLine) return;
        if (!isValidating) onOrderClick(drink.id);
      }}
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
        {cartLine ? (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-gray-50 p-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDecrement?.();
              }}
              disabled={stepperPending}
              className="grid h-7 w-7 place-items-center rounded-full bg-white text-[var(--color-primary)] shadow-sm transition-colors active:bg-gray-100 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="w-4 text-center text-xs font-semibold text-gray-900">
              {stepperPending ? (
                <Loader2 size={12} className="mx-auto animate-spin text-gray-500" />
              ) : (
                cartLine.quantity
              )}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIncrement?.();
              }}
              disabled={stepperPending}
              className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-primary)] text-white shadow-sm transition-colors active:bg-[var(--color-primary-dark)] disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
            {isValidating ? (
              <Loader2 size={16} className="text-white animate-spin" />
            ) : (
              <Plus size={16} className="text-white" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
