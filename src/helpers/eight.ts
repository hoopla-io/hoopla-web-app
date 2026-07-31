// Support for running inside the Eight miniapp platform's WebView.
//
// Two things differ from a plain browser / Telegram launch:
//
//   1. Auth. Eight calls hoopla-api's /eight/login itself, before we render, and
//      hands us the resulting session token on the launch URL. There is no SMS
//      step and — unlike every other session — no refresh token, because Eight's
//      /login contract returns a single token string. A session therefore lives
//      exactly as long as that access token; renewing it means Eight relaunching
//      the miniapp, not a call we can make.
//
//   2. Payment. Instead of navigating to a Rahmat checkout_url we ask the host's
//      native SDK to open its own payment sheet, over the JS bridge it injects.
//
// SECURITY: accepting a session token off the URL is session fixation waiting to
// happen — a link of the form ?token=<attacker's JWT> must never be able to sign
// a visitor into someone else's account and take their payments with it. Three
// independent gates, none of them optional:
//   • this is the Anor build (anor.hoopla.uz). The public web.hoopla.uz bundle
//     is compiled with the flag off, so none of the code below survives into it,
//   • the host's native bridge is actually present (you cannot be inside Eight's
//     WebView without it, so a link opened in a normal browser is inert), and
//   • the token really came from our own /eight/login, proven by the `platform`
//     claim that only that endpoint mints.
// Anything that fails any check is discarded without touching the existing
// session.

// Vite replaces this with a literal at build time, so `if (!IS_EIGHT_BUILD)`
// below is dead code the minifier drops entirely from the public bundle.
const IS_EIGHT_BUILD = import.meta.env.VITE_HOST_PLATFORM === "eight";

const TOKEN_PARAM_NAMES = ["token", "access_token", "accessToken"];

const EIGHT_SESSION_KEY = "eight_session";

// The host injects its bridge as the page loads, not necessarily before our
// bundle runs, so give it a moment rather than failing the launch outright.
const BRIDGE_WAIT_MS = 3000;
const BRIDGE_POLL_MS = 100;

/** True in the anor.hoopla.uz bundle regardless of runtime host — for hiding
 * UI that must not exist on that domain at all (e.g. Rahmat balance top-up,
 * whose checkout_url would navigate the customer out of the host WebView). */
export function isEightBuild(): boolean {
  return IS_EIGHT_BUILD;
}

/** True only while the host's native bridge is actually callable. */
export function hasNativeBridge(): boolean {
  return IS_EIGHT_BUILD && typeof window.nativeBridge?.postMessage === "function";
}

/** Reports whether this launch is running inside the Eight host app. */
export function isEightHost(): boolean {
  return IS_EIGHT_BUILD && (hasNativeBridge() || sessionFlagSet());
}

function sessionFlagSet(): boolean {
  try {
    return localStorage.getItem(EIGHT_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markEightSession(): void {
  try {
    localStorage.setItem(EIGHT_SESSION_KEY, "1");
  } catch {
    /* private mode / storage disabled */
  }
}

export function clearEightSession(): void {
  try {
    localStorage.removeItem(EIGHT_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function waitForNativeBridge(): Promise<boolean> {
  if (hasNativeBridge()) return Promise.resolve(true);

  return new Promise((resolve) => {
    const deadline = Date.now() + BRIDGE_WAIT_MS;
    const timer = setInterval(() => {
      if (hasNativeBridge()) {
        clearInterval(timer);
        resolve(true);
      } else if (Date.now() >= deadline) {
        clearInterval(timer);
        resolve(false);
      }
    }, BRIDGE_POLL_MS);
  });
}

/** Decode a JWT payload without verifying it. Only ever used to read our own
 * `platform` claim as a sanity check — the backend verifies for real. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** True only for a token our own /eight/login minted — it is the sole place the
 * `platform` claim is set, so an ordinary session token is rejected here. */
function isEightSessionToken(token: string): boolean {
  return decodeJwtPayload(token)?.platform === "eight";
}

/**
 * Every query string in the URL. The app uses a HashRouter, so a param can
 * legitimately arrive either before the hash (`/?token=x#/`) or inside it
 * (`/#/?token=x`) depending on how Eight builds the launch URL.
 */
function queryStrings(): URLSearchParams[] {
  const found = [new URLSearchParams(window.location.search)];

  const hashQueryStart = window.location.hash.indexOf("?");
  if (hashQueryStart !== -1) {
    found.push(new URLSearchParams(window.location.hash.slice(hashQueryStart + 1)));
  }

  return found;
}

/**
 * Pull the launch token off the URL, if present.
 *
 * Eight can deliver it either as a query param or as an HTTP header. A
 * client-side app can only ever read the query param — it never sees the headers
 * of its own document request — so that is the only mode this supports, and the
 * integration must be configured accordingly on Eight's side.
 *
 * The value may arrive as a composite ("Bearer {token}") when Eight is set up to
 * mirror a whole header value, so strip that prefix. URLSearchParams already
 * percent-decodes, so "Bearer%20x" and "Bearer+x" both arrive as "Bearer x".
 */
export function readLaunchToken(): string | null {
  for (const params of queryStrings()) {
    for (const name of TOKEN_PARAM_NAMES) {
      const raw = params.get(name);
      if (raw && raw.trim()) {
        return raw.trim().replace(/^Bearer\s+/i, "");
      }
    }
  }

  return null;
}

/**
 * Remove the token from the address bar once handled, so it doesn't sit in
 * history or leak through a Referer header on a later navigation. Preserves the
 * router's history state — replaceState(null) would blank it and break
 * react-router's notion of the current entry.
 */
export function stripLaunchTokenFromUrl(): void {
  const url = new URL(window.location.href);
  let changed = false;

  for (const name of TOKEN_PARAM_NAMES) {
    if (url.searchParams.has(name)) {
      url.searchParams.delete(name);
      changed = true;
    }
  }

  const hashQueryStart = url.hash.indexOf("?");
  if (hashQueryStart !== -1) {
    const hashPath = url.hash.slice(0, hashQueryStart);
    const hashParams = new URLSearchParams(url.hash.slice(hashQueryStart + 1));
    for (const name of TOKEN_PARAM_NAMES) {
      if (hashParams.has(name)) {
        hashParams.delete(name);
        changed = true;
      }
    }
    const rest = hashParams.toString();
    url.hash = rest ? `${hashPath}?${rest}` : hashPath;
  }

  if (changed) {
    window.history.replaceState(window.history.state, "", url.toString());
  }
}

/**
 * Capture an Eight launch token into token storage. Call once at boot, before
 * the auth context decides whether the user is signed in.
 *
 * Returns true only if a token was accepted and stored. A token that fails
 * either gate is dropped from the URL and otherwise ignored — the existing
 * session is left exactly as it was.
 */
export async function captureEightLaunch(
  storeToken: (accessToken: string) => void
): Promise<boolean> {
  if (!IS_EIGHT_BUILD) return false;

  const token = readLaunchToken();
  if (!token) return false;

  // Order matters: reject a foreign/garbage token before spending three seconds
  // waiting for a bridge that a normal browser will never have.
  if (!isEightSessionToken(token)) {
    stripLaunchTokenFromUrl();
    return false;
  }

  if (!(await waitForNativeBridge())) {
    stripLaunchTokenFromUrl();
    return false;
  }

  storeToken(token);
  markEightSession();
  stripLaunchTokenFromUrl();
  return true;
}

/**
 * Ask the host app to open its native payment sheet for an order we've already
 * registered with Eight (`bridge_order_id`, their host_app_order_id).
 *
 * Returns false when the bridge isn't there — the caller must surface that
 * rather than leaving the customer on a screen waiting for a sheet that will
 * never appear.
 */
export function startEightPayment(bridgeOrderId: string): boolean {
  if (!hasNativeBridge()) return false;

  try {
    window.nativeBridge!.postMessage("start_payment", { order_id: bridgeOrderId });
    return true;
  } catch {
    return false;
  }
}
