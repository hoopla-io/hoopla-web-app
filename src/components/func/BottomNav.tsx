import { cn } from "@/helpers/utils";
import { Home, MapPin, ReceiptText, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
      <nav className="max-w-lg mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center p-2 text-gray-600 transition-colors",
                isActive && "text-[var(--color-primary)]"
              )
            }
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </NavLink>

          <NavLink
            to="/map"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center p-2 text-gray-600 transition-colors",
                isActive && "text-[var(--color-primary)]"
              )
            }
          >
            <MapPin size={20} />
            <span className="text-xs mt-1">Map</span>
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center p-2 text-gray-600 transition-colors",
                isActive && "text-[var(--color-primary)]"
              )
            }
          >
            <ReceiptText size={20} />
            <span className="text-xs mt-1">Orders</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center p-2 text-gray-600 transition-colors",
                isActive && "text-[var(--color-primary)]"
              )
            }
          >
            <User size={20} />
            <span className="text-xs mt-1">Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
