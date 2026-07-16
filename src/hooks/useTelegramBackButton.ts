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
    const tg = window.Telegram?.WebApp;
    const backButton = tg?.BackButton;
    // BackButton needs Bot API 6.1+. The property exists even outside a real
    // Telegram client (and on older clients) — telegram-web-app.js provides a
    // stub that self-reports version "6.0" in a plain browser — but calling
    // its methods below the required version just logs a "not supported"
    // error, so gate on isVersionAtLeast the same way initTelegram() already
    // does for the fullscreen (8.0+) features.
    if (!backButton || !tg?.isVersionAtLeast?.("6.1")) return;

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
