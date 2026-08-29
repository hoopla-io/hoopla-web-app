import { FC } from "react";

import {
  cn,
  getShopOpenStatus,
  isWithinWorkingHours,
  type WorkingHour,
} from "@/helpers/utils";

type Props = {
  /**
   * Real-time availability (from the shop list endpoint). When provided this
   * takes precedence over `todayWorkingHours`/`workingHours`.
   */
  acceptingOrders?: boolean;
  /** ISO timestamp the shop is paused until, or null when not paused. */
  pausedUntil?: string | null;
  /** Today's hours, resolved server-side. Preferred over `workingHours` when
   * `acceptingOrders` isn't available — avoids a client weekday lookup. */
  todayWorkingHours?: { openAt: string; closeAt: string } | null;
  /** Weekly hours fallback, used only when `todayWorkingHours` isn't passed. */
  workingHours?: WorkingHour[] | null;
  className?: string;
};

/**
 * Small pill showing whether a shop is currently Open or Closed. Prefers the
 * real-time `acceptingOrders` flag, then `todayWorkingHours`, then derives
 * status from the weekly `workingHours` (and renders nothing when none of
 * these are available).
 */
export const ShopStatusBadge: FC<Props> = ({
  acceptingOrders,
  pausedUntil,
  todayWorkingHours,
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
  } else if (todayWorkingHours !== undefined) {
    if (!todayWorkingHours) return null;
    isOpen = isWithinWorkingHours(todayWorkingHours);
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
