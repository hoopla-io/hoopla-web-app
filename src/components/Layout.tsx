import { Outlet, useLocation } from "react-router";
import BottomNav from "@/components/func/BottomNav";
import { Header } from "@/components/func/Header";
import { Toaster } from "react-hot-toast";
import { SearchProvider } from "@/context/search.context";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";

export default function Layout() {
  useTelegramBackButton();
  const { pathname } = useLocation();
  // Shop detail has its own hero + sticky category bar, so the floating app
  // header is redundant there. Hide it (only on the detail page itself, not
  // the /shops/:id/order/... sub-routes).
  const hideHeader = /^\/shops\/[^/]+$/.test(pathname);

  return (
    <SearchProvider>
      <main>
        {!hideHeader && <Header />}
        <div className="mb-[74px]">
          <Outlet />
        </div>
        <Toaster />
        <BottomNav />
      </main>
    </SearchProvider>
  );
}
