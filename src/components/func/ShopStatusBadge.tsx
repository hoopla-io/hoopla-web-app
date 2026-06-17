import { FC } from "react";

import { cn, getShopOpenStatus, type WorkingHour } from "@/helpers/utils";

type Props = {
  /**
   * Real-time availability (from the shop list endpoint). When provided this
   * takes precedence over `workingHours`.
   */
  acceptingOrders?: boolean;
  /** ISO timestamp the shop is paused until, or null when not paused. */
  pausedUntil?: string | null;
  /** Weekly hours fallback (used where real-time availability isn't available). */
  workingHours?: WorkingHour[] | null;
  className?: string;
};

/**
 * Small pill showing whether a shop is currently Open or Closed. Prefers the
 * real-time `acceptingOrders` flag; otherwise derives status from today's
 * working hours (and renders nothing when neither is available).
 */
export const ShopStatusBadge: FC<Props> = ({
  acceptingOrders,
  pausedUntil,
  workingHours,
  className,
}) => {
  let isOpen: boolean;

  if (acceptingOrders !== undefined) {
    // A malformed pausedUntil is treated as paused (closed) rather than open,
    // so a bad timestamp never lets users order from a paused shop.
    let paused = false;
    if (pausedUntil) {
      const until = new Date(pausedUntil).getTime();
      paused = Number.isNaN(until) || until > Date.now();
    }
    isOpen = acceptingOrders === true && !paused;
  } else {
    const status = getShopOpenStatus(workingHours);
    if (!status.todayHours) return null;
    isOpen = status.isOpen;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] backdrop-blur-lg shadow-sm ring-1",
        isOpen
          ? "bg-emerald-50/55 text-emerald-700 ring-white/50"
          : "bg-white/50 text-gray-700 ring-white/50",
        className
      )}
    >
      {isOpen ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      ) : (
        <span className="h-2 w-2 rounded-full bg-gray-300" />
      )}
      {isOpen ? "Open" : "Closed"}
    </span>
  );
};
