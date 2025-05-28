// src/global.d.ts
interface TelegramWebApp {
  onEvent(event: string, callback: () => void): void;
  offEvent(event: string, callback: () => void): void;
  viewportHeight: number;
  viewportStableHeight: number;
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
