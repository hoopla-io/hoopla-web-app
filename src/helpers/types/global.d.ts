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

interface TelegramWebApp {
  onEvent(event: string, callback: () => void): void;
  offEvent(event: string, callback: () => void): void;
  viewportHeight: number;
  viewportStableHeight: number;
  // Signed launch params — a non-empty string only inside a real Telegram
  // client; "" in a plain browser. `platform` is "unknown" outside Telegram.
  initData?: string;
  platform?: string;
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
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
