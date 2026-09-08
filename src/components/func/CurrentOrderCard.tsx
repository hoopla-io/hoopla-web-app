import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Coffee } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";

import type { ActiveOrder } from "@/api/domains/orders";
import { getDateFnsLocale } from "@/helpers/utils";

/** Status → user-facing label key shown in the pill. */
const statusLabelKeys: Record<string, string> = {
  pending_payment: "currentOrderCard.status.pendingPayment",
  pending: "currentOrderCard.status.pending",
  preparing: "currentOrderCard.status.preparing",
  ready: "currentOrderCard.status.ready",
};

const relativeTime = (purchasedAt: string): string => {
  const date = new Date(purchasedAt);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true, locale: getDateFnsLocale() });
};

interface CurrentOrderCardProps {
  order: ActiveOrder;
}

export const CurrentOrderCard: FC<CurrentOrderCardProps> = ({ order }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const statusLabel = t(
    statusLabelKeys[order.orderStatus] ?? "currentOrderCard.status.inProgress"
  );
  const timeAgo = relativeTime(order.purchasedAt);

  return (
    <button
      type="button"
      onClick={() => navigate(`/orders/${order.id}`)}
      className="w-full rounded-2xl bg-[var(--color-primary)] p-5 text-left text-white shadow-[0_12px_30px_-16px_rgba(141,11,65,0.6)] transition-transform active:scale-[0.99]"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-lg font-semibold">{t("currentOrderCard.currentOrder")}</span>
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
