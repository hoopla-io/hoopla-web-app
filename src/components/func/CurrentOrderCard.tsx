import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Coffee } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import type { ActiveOrder } from "@/api/domains/orders";

/** Status → user-facing label shown in the pill. */
const statusLabels: Record<string, string> = {
  pending_payment: "Awaiting payment",
  pending: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
};

const relativeTime = (purchasedAt: string): string => {
  const date = new Date(purchasedAt);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
};

interface CurrentOrderCardProps {
  order: ActiveOrder;
}

export const CurrentOrderCard: FC<CurrentOrderCardProps> = ({ order }) => {
  const navigate = useNavigate();
  const statusLabel = statusLabels[order.orderStatus] ?? "In progress";
  const timeAgo = relativeTime(order.purchasedAt);

  return (
    <button
      type="button"
      onClick={() => navigate(`/orders/${order.id}`)}
      className="w-full rounded-2xl bg-[var(--color-primary)] p-5 text-left text-white shadow-[0_12px_30px_-16px_rgba(141,11,65,0.6)] transition-transform active:scale-[0.99]"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-lg font-semibold">Current order</span>
        <span className="flex-shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
          {statusLabel}
        </span>
      </div>

      <div className="my-4 h-px bg-white/15" />

      {/* Body */}
      <div className="flex items-center gap-3">
        {order.shopIconUrl ? (
          <img
            src={order.shopIconUrl}
            alt={order.shopName}
            className="h-12 w-12 flex-shrink-0 rounded-xl bg-white/10 object-cover"
          />
        ) : (
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-white/10">
            <Coffee size={22} className="text-white/90" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-semibold leading-tight">
            {order.drinkName}
          </h3>
          <p className="truncate text-sm text-white/70">
            {order.shopName}
            {timeAgo ? ` • ${timeAgo}` : ""}
          </p>
        </div>

        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-white/40 transition-transform active:scale-90">
          <ChevronRight size={18} />
        </div>
      </div>
    </button>
  );
};
