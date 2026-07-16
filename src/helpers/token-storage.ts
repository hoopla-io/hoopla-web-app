// Bearer-token storage that stays reliable in both a plain browser and a
// Telegram Mini App.
//
// The problem: inside Telegram's in-app WebView, localStorage is NOT a durable
// store — it can be evicted between launches, so the tokens (and therefore the
// Authorization: Bearer header) sometimes come back null. Telegram's
// CloudStorage is persisted server-side and synced across all of the user's
// Telegram sessions/devices, so it survives.
//
// Strategy:
//   • An in-memory cache backs every read, so the (synchronous) axios request
//     interceptor never has to await anything.
//   • Browser: localStorage is the durable store; memory is seeded from it at
//     module load, so behavior is unchanged.
//   • Telegram: CloudStorage is the durable store. We hydrate it into memory
//     (mirroring into localStorage) once at boot — recovering a session even if
//     the WebView's localStorage was wiped — and write through on every change.

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / storage disabled */
  }
}
function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// Seeded synchronously from localStorage so the browser path works before
// hydrateTokens() ever runs (and is a no-op difference for browsers).
let memory: { access: string | null; refresh: string | null } = {
  access: safeGet(ACCESS_KEY),
  refresh: safeGet(REFRESH_KEY),
};

/**
 * Telegram CloudStorage, or undefined outside Telegram / on older clients.
 * CloudStorage needs Bot API 6.9+ — the property exists even outside a real
 * Telegram client (telegram-web-app.js provides a stub that self-reports
 * version "6.0" in a plain browser) but calling its methods below the
 * required version just logs a "not supported" error, so gate on
 * isVersionAtLeast the same way initTelegram() already does elsewhere.
 */
function cloud() {
  const tg = window.Telegram?.WebApp;
  if (!tg?.isVersionAtLeast?.("6.9")) return undefined;
  return tg.CloudStorage;
}

export function getAccessToken(): string | null {
  return memory.access ?? safeGet(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return memory.refresh ?? safeGet(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  memory = { access: accessToken, refresh: refreshToken };
  safeSet(ACCESS_KEY, accessToken);
  safeSet(REFRESH_KEY, refreshToken);
  const cs = cloud();
  cs?.setItem(ACCESS_KEY, accessToken, () => {});
  cs?.setItem(REFRESH_KEY, refreshToken, () => {});
}

export function clearTokens(): void {
  memory = { access: null, refresh: null };
  safeRemove(ACCESS_KEY);
  safeRemove(REFRESH_KEY);
  cloud()?.removeItems([ACCESS_KEY, REFRESH_KEY], () => {});
}

// Keep the in-memory cache in sync when another browser tab logs in or out.
// `storage` fires only in *other* tabs, so this tab's own writes don't re-enter.
// A null `key` means localStorage was cleared wholesale — re-read both.
window.addEventListener("storage", (event) => {
  if (event.key === ACCESS_KEY) {
    memory.access = event.newValue;
  } else if (event.key === REFRESH_KEY) {
    memory.refresh = event.newValue;
  } else if (event.key === null) {
    memory = { access: safeGet(ACCESS_KEY), refresh: safeGet(REFRESH_KEY) };
  }
});

function getCloudItems(keys: string[]): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    const cs = cloud();
    if (!cs) return resolve({});

    let settled = false;
    const finish = (values: Record<string, string>) => {
      if (settled) return;
      settled = true;
      resolve(values);
    };
    // Guard against a callback that never fires so boot can't hang forever.
    const timer = setTimeout(() => finish({}), 2000);

    try {
      cs.getItems(keys, (error, values) => {
        clearTimeout(timer);
        finish(error || !values ? {} : values);
      });
    } catch {
      clearTimeout(timer);
      finish({});
    }
  });
}

/**
 * Load tokens from the durable store into the in-memory cache. Call once at app
 * boot and await it before treating the user as signed out.
 *
 * Browser / old Telegram: a no-op — memory was already seeded from localStorage.
 * Telegram: pulls from CloudStorage (recovering a session even if the WebView's
 * localStorage was cleared) and mirrors the result into localStorage for the
 * synchronous interceptor path.
 *
 * Note: we deliberately do NOT push local tokens up when CloudStorage is empty.
 * That can't tell a first-time migration from a store that was just cleared by a
 * logout/401, so it risks re-publishing a dead token. Cloud durability is
 * re-established on the next login/refresh instead (both call setTokens, which
 * write through) — a migrating user stays authed via the localStorage-seeded
 * memory until then.
 */
export async function hydrateTokens(): Promise<void> {
  const cs = cloud();
  if (!cs) return;

  const values = await getCloudItems([ACCESS_KEY, REFRESH_KEY]);
  const access = values[ACCESS_KEY] || null;
  const refresh = values[REFRESH_KEY] || null;

  if (access && refresh) {
    memory = { access, refresh };
    safeSet(ACCESS_KEY, access);
    safeSet(REFRESH_KEY, refresh);
  }
}
