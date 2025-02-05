"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import useTelegramApp from "@/hooks/useTelegramApp";
import { useEffect } from "react";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { close } = useTelegramApp();

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      if (pathname === "/") {
        window.Telegram.WebApp.BackButton.hide();
      } else {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => router.back());
      }
    }
  }, [pathname, router, close]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-background shadow-md z-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center space-x-2">
            hoopla
          </Link>
          <div className="flex items-center space-x-4">
            <button className="text-text hover:text-primary transition-colors">
              <Bell size={24} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
