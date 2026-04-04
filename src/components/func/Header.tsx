import { FC } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";

import { useGetMe } from "@/api/hooks/profile.hook";

export const Header: FC = () => {
  const { userInfo } = useGetMe();
  const unreadCount = userInfo?.unreadNotifications ?? 0;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link
            to="/"
            className="font-eugusto text-2xl text-[var(--color-primary)] tracking-wide"
          >
            hoopla
          </Link>
          <Link
            to="/notifications"
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Bell size={22} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};
