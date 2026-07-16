import { cn } from "@/helpers/utils";
import { Home, MapPin, ReceiptText, ShoppingBag, User } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useEditableFocused } from "@/hooks/useEditableFocused";
import { useAuth } from "@/context/auth.context";
import { useCartCount } from "@/api/hooks/cart.hook";

type NavItem = {
  to: string;
  end?: boolean;
  icon: typeof Home;
  label: string;
  badge?: number;
};

const BottomNav = () => {
  // Slide the bar out of the way while typing so it doesn't crowd the keyboard.
  const editableFocused = useEditableFocused();
  const { isAuthenticated } = useAuth();
  const cartCount = useCartCount();

  const navItems: NavItem[] = [
    { to: "/", end: true, icon: Home, label: "Home" },
    { to: "/map", icon: MapPin, label: "Map" },
    ...(isAuthenticated
      ? [{ to: "/cart", icon: ShoppingBag, label: "Cart", badge: cartCount }]
      : []),
    { to: "/orders", icon: ReceiptText, label: "Orders" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    // Outer layer is click-through in its margins so the floating bar doesn't
    // block taps around it; the safe-area inset clears the iOS home indicator.
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+var(--tg-bottom-inset,0px)+0.625rem)] transition-transform duration-200",
        editableFocused && "translate-y-full"
      )}
    >
      <nav className="pointer-events-auto mx-auto max-w-md">
        <ul className="flex items-stretch justify-around gap-1 rounded-[28px] bg-white/80 px-2 py-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.06] backdrop-blur-2xl">
          {navItems.map(({ to, end, icon: Icon, label, badge }) => (
            <li key={to} className="flex-1">
              <NavLink to={to} end={end} aria-label={label}>
                {({ isActive }) => (
                  <div className="flex flex-col items-center gap-1 py-1 transition-transform duration-200 active:scale-90">
                    {/* Soft tinted circle behind the active icon (works with
                        outline icons; lucide doesn't ship filled variants). */}
                    <span
                      className={cn(
                        "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200",
                        isActive ? "bg-[var(--color-primary)]/12" : "bg-transparent"
                      )}
                    >
                      <Icon
                        size={22}
                        strokeWidth={isActive ? 2.4 : 2}
                        className={cn(
                          "transition-colors duration-200",
                          isActive
                            ? "text-[var(--color-primary)]"
                            : "text-gray-600"
                        )}
                      />
                      {!!badge && badge > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold leading-none tracking-tight transition-colors duration-200",
                        isActive
                          ? "text-[var(--color-primary)]"
                          : "text-gray-600"
                      )}
                    >
                      {label}
                    </span>
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default BottomNav;
