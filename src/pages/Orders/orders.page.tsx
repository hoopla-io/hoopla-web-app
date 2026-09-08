import { FC, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ReceiptText, Loader2, Coffee, Coins } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { useOrders } from "@/api/hooks/orders.hook";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";
import { formatMoney, getDateFnsLocale } from "@/helpers/utils";

export const OrdersPage: FC = () => {
  const { t } = useTranslation();
  const {
    orders,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useOrders();
  const observerRef = useRef<HTMLDivElement>(null);

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

  if (isLoading) {
    return (
      <LoadingScreen header={t("orders.loadingHeader")} description={t("common.pleaseWait")} />
    );
  }

  return (
    <Page>
      <div className="max-w-lg mx-auto px-4 pt-2 pb-28">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          {t("orders.title")}
        </h1>

        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ReceiptText size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("orders.emptyTitle")}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t("orders.emptyDescription")}
            </p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-2">
            {orders.map((order) => {
              const images =
                order.drinks.length > 0
                  ? order.drinks.map((d) => d.drinkImageUrl).filter(Boolean)
                  : order.shopIconUrl
                  ? [order.shopIconUrl]
                  : [];
              const hasOverflow = images.length > 4;
              const visibleImages = hasOverflow ? images.slice(0, 3) : images.slice(0, 4);
              const extraCount = hasOverflow ? images.length - 3 : 0;

              const totalPrice = order.drinks.reduce(
                (sum, d) => sum + d.drinkPrice,
                0
              );
              const drinkNames = order.drinks.map((d) => d.drinkName).join(", ");

              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="bg-white rounded-2xl shadow-sm p-3 active:scale-[0.98] transition-transform block select-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">
                        {order.shopName}
                      </h3>
                      {drinkNames && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {drinkNames}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(order.purchasedAt), "d MMMM HH:mm, yyyy", {
                          locale: getDateFnsLocale(),
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      {formatMoney(totalPrice, t)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    {images.length > 0 ? (
                      <>
                        {visibleImages.map((src, idx) => (
                          <img
                            key={idx}
                            src={src}
                            alt={drinkNames}
                            className="w-12 h-12 rounded-xl object-cover ring-1 ring-black/5 flex-shrink-0"
                          />
                        ))}
                        {extraCount > 0 && (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-gray-500">
                              +{extraCount}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Coffee size={18} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  {order.cashback_earned > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                        <Coins size={13} />
                        +{formatMoney(order.cashback_earned, t)}
                      </span>
                      <span className="text-xs text-gray-400">{t("orders.cashbackEarned")}</span>
                    </div>
                  )}
                </Link>
              );
            })}

            <div ref={observerRef} className="py-4 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              )}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
};
