import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Bottom-nav root tabs. These are top-level destinations, so they show no
// native back button; every other route does.
const ROOT_PATHS = new Set(["/", "/map", "/orders", "/profile"]);

/**
 * Drives Telegram's native BackButton from the current route: hidden on the
 * root tabs, shown elsewhere and wired to go back one step in app history
 * (falling back to Home when there's nowhere to go). No-op outside Telegram.
 */
export function useTelegramBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const backButton = window.Telegram?.WebApp?.BackButton;
    if (!backButton) return;

    if (ROOT_PATHS.has(location.pathname)) {
      backButton.hide();
      return;
    }

    const handleBack = () => {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/");
      }
    };

    backButton.onClick(handleBack);
    backButton.show();

    // Only detach the handler here — hiding is owned by the root-path branch,
    // so navigating between two sub-pages keeps the button steady (no flicker).
    return () => {
      backButton.offClick(handleBack);
    };
  }, [location.pathname, navigate]);
}
