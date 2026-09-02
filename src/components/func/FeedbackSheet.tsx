import { FC, useEffect, useState } from "react";
import { Coffee, Star, X } from "lucide-react";
import toast from "react-hot-toast";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  useLeaveFeedback,
  useOrderDetail,
  usePendingFeedback,
} from "@/api/hooks/orders.hook";
import { formatBalance } from "@/helpers/utils";
import type { PendingFeedbackOrder } from "@/api/domains/orders";

const dismissKey = (orderId: number) => `feedback-sheet-dismissed-${orderId}`;

/**
 * "How was your experience?" bottom sheet shown over the home screen when the
 * latest completed order has no feedback yet. One horizontally scrollable
 * card per ordered drink; tapping a star submits that item's rating.
 */
export const FeedbackSheet: FC = () => {
  const { pendingOrder } = usePendingFeedback();
  // Snapshot the first pending order so the sheet doesn't swap content when
  // the query refetches mid-interaction (rating any item clears "pending").
  const [order, setOrder] = useState<PendingFeedbackOrder | null>(null);
  const [open, setOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const { order: detail } = useOrderDetail(order?.id ?? 0);
  const leaveFeedback = useLeaveFeedback();

  useEffect(() => {
    if (order || !pendingOrder || pendingOrder.drinks.length === 0) return;
    if (sessionStorage.getItem(dismissKey(pendingOrder.id))) return;
    setOrder(pendingOrder);
    setOpen(true);
  }, [pendingOrder, order]);

  if (!order) return null;

  const modifiersFor = (orderItemId: number) =>
    (detail?.items ?? [])
      .filter((i) => i.parent_item_id === orderItemId)
      .map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name))
      .join(", ");

  const close = () => {
    sessionStorage.setItem(dismissKey(order.id), "1");
    setOpen(false);
  };

  const rateItem = (orderItemId: number, rating: number) => {
    if (ratings[orderItemId] || leaveFeedback.isPending) return;
    setRatings((prev) => ({ ...prev, [orderItemId]: rating }));
    leaveFeedback.mutate(
      { orderItemId, rating },
      {
        onSuccess: () => {
          toast.success("Thanks for your feedback!");
          const rated = { ...ratings, [orderItemId]: rating };
          if (order.drinks.every((d) => rated[d.orderItemId])) {
            setTimeout(close, 600);
          }
        },
        onError: () => {
          setRatings((prev) => {
            const next = { ...prev };
            delete next[orderItemId];
            return next;
          });
          toast.error("Failed to submit feedback");
        },
      }
    );
  };

  return (
    <Drawer open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerTitle className="sr-only">How was your experience?</DrawerTitle>
        <DrawerDescription className="sr-only">
          Rate the drinks from your last order at {order.shopName}
        </DrawerDescription>

        <div className="relative px-4 pb-6 pt-1">
          <button
            aria-label="Close"
            onClick={close}
            className="absolute right-3 top-0 grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
          >
            <X size={16} />
          </button>

          <h2 className="mb-4 pt-1 text-center text-lg font-bold text-gray-900">
            How was your experience?
          </h2>

          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {order.drinks.map((drink) => {
              const rated = ratings[drink.orderItemId] ?? 0;
              const modifiers = modifiersFor(drink.orderItemId);

              return (
                <div
                  key={drink.orderItemId}
                  className="flex w-[85%] flex-shrink-0 snap-center items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="grid h-20 w-20 flex-shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-50">
                    {drink.drinkImageUrl ? (
                      <img
                        src={drink.drinkImageUrl}
                        alt={drink.drinkName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Coffee className="text-gray-300" size={28} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-gray-900">
                      {drink.drinkName}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">
                      {modifiers || `${formatBalance(drink.drinkPrice)} UZS`}
                    </p>
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          aria-label={`Rate ${s} stars`}
                          disabled={rated > 0}
                          onClick={() => rateItem(drink.orderItemId, s)}
                          className="transition-transform active:scale-110"
                        >
                          <Star
                            size={26}
                            className={
                              s <= rated
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-200"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
