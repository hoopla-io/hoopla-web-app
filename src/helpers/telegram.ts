// Telegram Mini App bootstrap.
//
// Expands the app, requests true fullscreen (Bot API 8.0+, which removes
// Telegram's top title bar), and mirrors Telegram's safe-area insets into CSS
// variables so our fixed header / bottom nav clear the status bar and
// Telegram's floating close/"···" controls.
//
// The combined top inset = device safe area (status bar / notch) + content safe
// area (Telegram's own controls); same for the bottom. Outside Telegram (plain
// browser) window.Telegram is undefined and the insets stay at their 0 default.

type Inset = { top: number; bottom: number; left: number; right: number };

const ZERO: Inset = { top: 0, bottom: 0, left: 0, right: 0 };

function setInsetVars(top: number, bottom: number, left: number, right: number) {
  const root = document.documentElement.style;
  root.setProperty("--tg-top-inset", `${top}px`);
  root.setProperty("--tg-bottom-inset", `${bottom}px`);
  root.setProperty("--tg-left-inset", `${left}px`);
  root.setProperty("--tg-right-inset", `${right}px`);
}

export function initTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return; // Running outside Telegram — keep the 0 insets from CSS.

  try {
    tg.ready?.();
    tg.expand?.();
  } catch {
    // Non-fatal: older clients may not implement every method.
  }

  const syncInsets = () => {
    const sa = (tg.safeAreaInset ?? ZERO) as Inset;
    const csa = (tg.contentSafeAreaInset ?? ZERO) as Inset;
    setInsetVars(
      (sa.top ?? 0) + (csa.top ?? 0),
      (sa.bottom ?? 0) + (csa.bottom ?? 0),
      (sa.left ?? 0) + (csa.left ?? 0),
      (sa.right ?? 0) + (csa.right ?? 0)
    );
  };

  // Fullscreen is Bot API 8.0+. On older clients / desktop the request fails
  // (fullscreenFailed: UNSUPPORTED) and we simply stay expanded with 0 insets,
  // so nothing breaks.
  if (tg.isVersionAtLeast?.("8.0")) {
    try {
      tg.setHeaderColor?.("#ffffff");
      tg.requestFullscreen?.();
    } catch {
      // ignore
    }
  }

  // Re-sync whenever the insets or fullscreen state change (entering fullscreen,
  // rotation, etc.) — the values arrive asynchronously after requestFullscreen.
  tg.onEvent?.("safeAreaChanged", syncInsets);
  tg.onEvent?.("contentSafeAreaChanged", syncInsets);
  tg.onEvent?.("fullscreenChanged", syncInsets);

  syncInsets();
}
