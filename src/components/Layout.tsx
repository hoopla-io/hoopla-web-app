import { Outlet } from "react-router";
import BottomNav from "@/components/func/BottomNav";
import { Header } from "@/components/func/Header";
import { Toaster } from "react-hot-toast";
import { SearchProvider } from "@/context/search.context";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";

export default function Layout() {
  useTelegramBackButton();

  return (
    <SearchProvider>
      <main>
        <Header />
        <div className="mb-[74px]">
          <Outlet />
        </div>
        <Toaster />
        <BottomNav />
      </main>
    </SearchProvider>
  );
}
