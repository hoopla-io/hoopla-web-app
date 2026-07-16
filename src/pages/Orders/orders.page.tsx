import { FC, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ReceiptText, Loader2, CheckCircle, XCircle, Clock, AlertCircle, Coffee, Coins } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

import { useOrders, useCancelOrder } from "@/api/hooks/orders.hook";
import type { Order } from "@/api/domains/orders";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";
import { formatBalance } from "@/helpers/utils";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  pending_payment: {
    label: "Awaiting Payment",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  pending: {
    label: "Preparing",
    icon: Coffee,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  paid: {
    label: "Preparing",
    icon: Coffee,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  preparing: {
    label: "Preparing",
    icon: Coffee,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  ready: {
    label: "Ready",
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
};

const LONG_PRESS_MS = 500;

export const OrdersPage: FC = () => {
  const {
    orders,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useOrders();
  const cancelOrder = useCancelOrder();
  const observerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const handleCancelConfirm = () => {
    if (!cancelTarget) return;
    cancelOrder.mutate(cancelTarget.id, {
      onSuccess: () => {
        toast.success("Order cancelled");
        setCancelTarget(null);
      },
      onError: () => toast.error("Failed to cancel order"),
    });
  };

  const startLongPress = useCallback((order: Order) => {
    if (order.orderStatus !== "pending_payment") return;
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setCancelTarget(order);
    }, LONG_PRESS_MS);
  }, []);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

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
      <LoadingScreen header="Loading orders" description="Please wait..." />
    );
  }

  return (
    <Page>
      <div className="max-w-lg mx-auto px-4 pt-2 pb-28">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Order History
        </h1>

        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ReceiptText size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No orders yet
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Your order history will appear here
            </p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-2">
            {orders.map((order) => {
              const status = statusConfig[order.orderStatus] ?? {
                label: "Processing",
                icon: Clock,
                color: "text-gray-500",
                bg: "bg-gray-100",
              };
              const StatusIcon = status.icon;

              const images =
                order.itemImages && order.itemImages.length > 0
                  ? order.itemImages
                  : order.shopIconUrl
                  ? [order.shopIconUrl]
                  : [];
              const hasOverflow = images.length > 4;
              const visibleImages = hasOverflow ? images.slice(0, 3) : images.slice(0, 4);
              const extraCount = hasOverflow ? images.length - 3 : 0;

              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="bg-white rounded-2xl shadow-sm p-3 active:scale-[0.98] transition-transform block select-none"
                  onTouchStart={() => startLongPress(order)}
                  onTouchEnd={clearLongPress}
                  onTouchMove={clearLongPress}
                  onMouseDown={() => startLongPress(order)}
                  onMouseUp={clearLongPress}
                  onMouseLeave={clearLongPress}
                  onContextMenu={(e) => {
                    if (order.orderStatus === "pending_payment") e.preventDefault();
                  }}
                  onClick={(e) => {
                    if (longPressTriggered.current) {
                      e.preventDefault();
                      longPressTriggered.current = false;
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">
                        {order.shopName}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(order.purchasedAt), "d MMMM HH:mm, yyyy")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatBalance(order.productPrice)} sum
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}
                      >
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    {images.length > 0 ? (
                      <>
                        {visibleImages.map((src, idx) => (
                          <img
                            key={idx}
                            src={src}
                            alt={order.drinkName}
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
                        +{formatBalance(order.cashback_earned)} UZS
                      </span>
                      <span className="text-xs text-gray-400">cashback earned</span>
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

      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your order
              {cancelTarget ? ` from ${cancelTarget.shopName}` : ""}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Go back</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-500 text-white hover:bg-red-600"
              onClick={handleCancelConfirm}
              disabled={cancelOrder.isPending}
            >
              {cancelOrder.isPending ? "Cancelling..." : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};
