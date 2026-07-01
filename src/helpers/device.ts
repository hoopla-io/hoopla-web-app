// Best-effort device identity for the current browser/session. Sent as the
// optional fields on /auth/confirm-sms so the /user/devices list shows a real
// label instead of null. The web exposes no true device model or hardware id,
// so these are heuristic — but stable within a given browser.

export interface DeviceInfo {
  deviceName: string;
  platform: string;
  deviceId: string;
  appVersion: string;
}

const DEVICE_ID_KEY = "device_id";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts / old browsers where randomUUID is absent.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Stable per-browser id, persisted in localStorage across sessions. */
function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage blocked (private mode / disabled) — use a volatile id.
    return generateId();
  }
}

/** OS/platform slug, e.g. "ios" | "android" | "macos" | "windows" | "web". */
function getPlatform(): string {
  const tgPlatform = window.Telegram?.WebApp?.platform;
  if (tgPlatform && tgPlatform !== "unknown") return tgPlatform;

  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macos";
  if (/Windows/i.test(ua)) return "windows";
  if (/Linux/i.test(ua)) return "linux";
  return "web";
}

/** Human-friendly label, e.g. "iPhone · Telegram" or "Windows · Chrome". */
function getDeviceName(): string {
  const ua = navigator.userAgent;

  let device = "Web";
  if (/iPhone/i.test(ua)) device = "iPhone";
  else if (/iPad/i.test(ua)) device = "iPad";
  else if (/Android/i.test(ua)) device = "Android";
  else if (/Macintosh|Mac OS X/i.test(ua)) device = "Mac";
  else if (/Windows/i.test(ua)) device = "Windows";
  else if (/Linux/i.test(ua)) device = "Linux";

  // Prefer "Telegram" as the client when we're inside a real Telegram client
  // (initData is a non-empty string only there), else name the browser.
  let client = "";
  if (window.Telegram?.WebApp?.initData) client = "Telegram";
  else if (/Edg\//.test(ua)) client = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) client = "Opera";
  else if (/Chrome\//.test(ua)) client = "Chrome";
  else if (/Firefox\//.test(ua)) client = "Firefox";
  else if (/Safari\//.test(ua)) client = "Safari";

  return client ? `${device} · ${client}` : device;
}

export function getDeviceInfo(): DeviceInfo {
  return {
    deviceName: getDeviceName(),
    platform: getPlatform(),
    deviceId: getDeviceId(),
    appVersion: __APP_VERSION__,
  };
}
