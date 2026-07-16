// src/global.d.ts
interface TelegramLocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  course: number | null;
  speed: number | null;
  horizontal_accuracy: number | null;
  vertical_accuracy: number | null;
}

interface TelegramLocationManager {
  isInited: boolean;
  isLocationAvailable: boolean;
  isAccessRequested: boolean;
  isAccessGranted: boolean;
  init(callback?: () => void): void;
  getLocation(callback: (data: TelegramLocationData | null) => void): void;
}

interface TelegramSafeAreaInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface TelegramBackButton {
  isVisible: boolean;
  show(): void;
  hide(): void;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
}

// Persistent per-user key/value store, synced across the user's Telegram
// sessions/devices. Bot API 6.9+, so optional on TelegramWebApp.
interface TelegramCloudStorage {
  setItem(
    key: string,
    value: string,
    callback?: (error: string | null, success?: boolean) => void
  ): void;
  getItem(
    key: string,
    callback: (error: string | null, value?: string) => void
  ): void;
  getItems(
    keys: string[],
    callback: (error: string | null, values?: Record<string, string>) => void
  ): void;
  removeItem(
    key: string,
    callback?: (error: string | null, success?: boolean) => void
  ): void;
  removeItems(
    keys: string[],
    callback?: (error: string | null, success?: boolean) => void
  ): void;
  getKeys(callback: (error: string | null, keys?: string[]) => void): void;
}

interface TelegramWebApp {
  onEvent(event: string, callback: () => void): void;
  offEvent(event: string, callback: () => void): void;
  viewportHeight: number;
  viewportStableHeight: number;
  // Signed launch params — a non-empty string only inside a real Telegram
  // client; "" in a plain browser. `platform` is "unknown" outside Telegram.
  initData?: string;
  // Parsed launch params. `start_param` carries the `?startapp=...` value from
  // a Mini App deep link (e.g. a shared shop link) — see useStartParamDeepLink.
  initDataUnsafe?: {
    start_param?: string;
    [key: string]: unknown;
  };
  platform?: string;
  // Open a t.me / external link from within the Mini App (Bot API 6.1+/6.9+).
  openTelegramLink?(url: string): void;
  openLink?(url: string): void;
  LocationManager?: TelegramLocationManager;
  // Layout / lifecycle (subset we use). Optional because older clients may
  // not implement them; fullscreen + safe areas need Bot API 8.0.
  ready?(): void;
  expand?(): void;
  isVersionAtLeast?(version: string): boolean;
  requestFullscreen?(): void;
  exitFullscreen?(): void;
  isFullscreen?: boolean;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  safeAreaInset?: TelegramSafeAreaInset;
  contentSafeAreaInset?: TelegramSafeAreaInset;
  BackButton?: TelegramBackButton;
  CloudStorage?: TelegramCloudStorage;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}

// Injected at build time from package.json `version` (see vite.config.ts).
declare const __APP_VERSION__: string;
