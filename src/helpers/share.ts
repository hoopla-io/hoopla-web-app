import toast from "react-hot-toast";

// Sharing a shop as a Telegram Mini App deep link.
//
// A share opens a `https://t.me/<bot>/<app>?startapp=shop_<id>` link. When a
// recipient taps it, Telegram launches this Mini App and passes `shop_<id>` as
// `initDataUnsafe.start_param`, which useStartParamDeepLink() routes to the
// shop (see that hook). The bot/app identity comes from env — the Mini App has
// no public web URL of its own.

// Telegram bot handle for the Mini App deep links (t.me/hooplauzbot/...).
const BOT = "hooplauzbot";
const APP = import.meta.env.VITE_TG_APP as string | undefined;

/** `startapp` value for a shop. Telegram allows [A-Za-z0-9_-] here. */
export function shopStartParam(shopId: number | string): string {
  return `shop_${shopId}`;
}

/** Parse an incoming `start_param` back into a shop id, or null if it isn't one. */
export function parseShopStartParam(param: string | undefined | null): number | null {
  if (!param) return null;
  const m = /^shop_(\d+)$/.exec(param);
  return m ? Number(m[1]) : null;
}

/**
 * The shareable Telegram deep link for a shop. Uses the bot's named Mini App
 * (`/<app>`) when VITE_TG_APP is set, otherwise the bot's main Mini App.
 */
export function buildShopShareLink(shopId: number | string): string {
  const base = APP ? `https://t.me/${BOT}/${APP}` : `https://t.me/${BOT}`;
  return `${base}?startapp=${shopStartParam(shopId)}`;
}

/**
 * Open the OS native share sheet (Web Share API) so the user can send the shop
 * link to any app. Falls back to copying the link when Web Share isn't
 * available (desktop / older webviews). A user-cancelled sheet is not an error.
 */
export async function shareShop(shopId: number, shopName: string): Promise<void> {
  const url = buildShopShareLink(shopId);
  const data: ShareData = { title: shopName, text: shopName, url };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(data);
      return;
    } catch (err) {
      // The user dismissed the share sheet — nothing went wrong.
      if ((err as { name?: string })?.name === "AbortError") return;
      // Any other failure falls through to the copy fallback below.
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  } catch {
    toast.error("Couldn't share this shop.");
  }
}
