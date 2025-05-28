import { Outlet } from "react-router";
import BottomNav from "@/components/func/BottomNav";
import { Header } from "@/components/func/Header";
import { Toaster } from "react-hot-toast";

export default function Layout() {
  return (
    <main>
      <Header />
      <div className="my-[74px]">
        <Outlet />
      </div>
      <Toaster />
      <BottomNav />
    </main>
  );
}
