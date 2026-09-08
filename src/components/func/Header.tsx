import { FC, useCallback, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Search, X } from "lucide-react";
import debounce from "lodash/debounce";
import { useTranslation } from "react-i18next";

import { useGetMe } from "@/api/hooks/profile.hook";
import { useSearch } from "@/context/search.context";
import { useSecretActivator } from "@/hooks/useSecretActivator";
import { toggleTestMode } from "@/helpers/testMode";

export const Header: FC = () => {
  const { t } = useTranslation();
  const { userInfo } = useGetMe();
  const unreadCount = userInfo?.unreadNotifications ?? 0;

  // Hidden gesture: tap the logo 5× to toggle test mode (X-Hoopla-Test + vConsole).
  const secretTap = useSecretActivator(() => void toggleTestMode());

  const { pathname } = useLocation();
  const isHome = pathname === "/";

  const { searchText, setSearchText, isSearchOpen, openSearch, closeSearch } =
    useSearch();

  const debouncedSetSearch = useCallback(
    debounce((value: string) => setSearchText(value), 400),
    []
  );

  // Cancel any pending debounced write when the overlay closes (incl. the
  // route-change reset in SearchContext) or the Header unmounts, so a trailing
  // setSearchText can't resurrect a stale query on another page.
  useEffect(() => {
    if (!isSearchOpen) debouncedSetSearch.cancel();
    return () => debouncedSetSearch.cancel();
  }, [isSearchOpen, debouncedSetSearch]);

  const handleClose = () => {
    debouncedSetSearch.cancel();
    closeSearch();
  };

  // Shared style for the circular iOS-style action controls.
  const control =
    "grid h-9 w-9 place-items-center rounded-full bg-gray-500/10 text-gray-700 transition-all duration-200 hover:bg-gray-500/[0.16] active:scale-90";

  return (
    // Floating glass pill mirroring the bottom nav. Outer is click-through in
    // its margins so taps around the pill reach the content beneath.
    <header className="pointer-events-none sticky top-0 z-30 px-3 pb-2 pt-[calc(0.5rem+var(--tg-top-inset,0px))]">
      <div className="pointer-events-auto mx-auto max-w-lg">
        <div className="flex min-h-[40px] items-center justify-between rounded-[26px] bg-white/80 px-5 py-2.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.3)] ring-1 ring-black/[0.06] backdrop-blur-2xl">
          {isSearchOpen ? (
            // Full-header search overlay: takes over the logo + icons.
            <div className="flex w-full items-center gap-2.5 duration-200 animate-in fade-in slide-in-from-right-4">
              <Search size={20} className="shrink-0 text-gray-500" />
              <input
                autoFocus
                defaultValue={searchText}
                onChange={(e) => debouncedSetSearch(e.target.value)}
                placeholder={t("header.searchPlaceholder")}
                className="flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400"
              />
              <button onClick={handleClose} aria-label={t("header.closeSearch")} className={control}>
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/"
                onClick={secretTap}
                className="font-eugusto text-2xl tracking-wide text-[var(--color-primary)]"
              >
                hoopla
              </Link>
              <div className="flex items-center gap-2">
                {isHome && (
                  <button onClick={openSearch} aria-label={t("header.searchCafes")} className={control}>
                    <Search size={19} />
                  </button>
                )}
                <Link
                  to="/notifications"
                  aria-label={t("header.notifications")}
                  className={`relative ${control}`}
                >
                  <Bell size={19} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
