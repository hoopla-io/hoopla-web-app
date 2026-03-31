import { FC, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ReceiptText, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

import { useOrders } from "@/api/hooks/orders.hook";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";
import { formatBalance } from "@/helpers/utils";

const statusConfig = {
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
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
};

export const OrdersPage: FC = () => {
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
              const status = statusConfig[order.orderStatus] ?? statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3 active:scale-[0.98] transition-transform block"
                >
                  <img
                    src={order.shopIconUrl}
                    alt={order.drinkName}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">
                      {order.drinkName}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {order.shopName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(order.purchasedAt), "MMM d, yyyy · HH:mm")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatBalance(order.productPrice)} UZS
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}
                    >
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                  </div>
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
