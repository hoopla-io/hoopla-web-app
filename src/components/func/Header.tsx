import { FC } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";

export const Header: FC = () => {
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
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Bell size={22} className="text-gray-600" />
          </Link>
        </div>
      </div>
    </header>
  );
};
