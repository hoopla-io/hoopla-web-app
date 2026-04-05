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

interface TelegramWebApp {
  onEvent(event: string, callback: () => void): void;
  offEvent(event: string, callback: () => void): void;
  viewportHeight: number;
  viewportStableHeight: number;
  LocationManager?: TelegramLocationManager;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
