import { cn, useKeyboardOpen } from "@/helpers/utils";
import { FixedLayout } from "@telegram-apps/telegram-ui";
import { Home, User, QrCode } from "lucide-react";
import { NavLink } from "react-router-dom";

const BottomNav = () => {
  const isKeyboardOpen = useKeyboardOpen();

  if (isKeyboardOpen) {
    return null;
  }

  return (
    <FixedLayout
      style={{
        backgroundColor: "var(--tg-theme-bg-color)",
      }}
      className="shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)]"
    >
      <nav className="max-w-2xl mx-auto px-6 py-2">
        <div className="flex items-center justify-between relative">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center p-2",
                isActive && "text-[var(--tg-theme-link-color)]"
              )
            }
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </NavLink>

          <div className="absolute left-1/2 -translate-x-1/2 -top-12">
            <NavLink
              to="/qr"
              className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-[var(--tg-theme-link-color)] shadow-lg border-4 border-[var(--tg-theme-secondary-bg-color)]"
            >
              <QrCode size={30} className="text-background" />
            </NavLink>
          </div>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center p-2",
                isActive && "text-[var(--tg-theme-link-color)]"
              )
            }
          >
            <User size={20} />
            <span className="text-xs mt-1">Profile</span>
          </NavLink>
        </div>
      </nav>
    </FixedLayout>
  );
};

export default BottomNav;
