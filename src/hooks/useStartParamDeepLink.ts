import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { parseShopStartParam } from "@/helpers/share";

/**
 * Handles a Telegram Mini App deep link on launch: when the app is opened via a
 * shared `?startapp=shop_<id>` link, Telegram exposes it as
 * `initDataUnsafe.start_param`. Read it once and route to that shop. Runs only
 * inside Telegram; a no-op in a plain browser (start_param is undefined).
 */
export function useStartParamDeepLink() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const param = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    const shopId = parseShopStartParam(param);
    if (shopId == null) return;

    handled.current = true;
    // Replace so the deep-link entry point isn't left in the back stack.
    navigate(`/shops/${shopId}`, { replace: true });
  }, [navigate]);
}
