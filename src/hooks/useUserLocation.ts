import { useCallback, useEffect, useState } from "react";

interface UserLocation {
  lat: number;
  lng: number;
}

interface UseUserLocationReturn {
  location: UserLocation | null;
  refresh: () => void;
  refreshing: boolean;
}

const DEFAULT_LOCATION: UserLocation = { lat: 41.2995, lng: 69.2401 };
const COOKIE_NAME = "hoopla_user_location";
const COOKIE_MAX_AGE = 86400; // 24 hours

function getLocationCookie(): UserLocation | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;

  const value = match.split("=")[1];
  const [lat, lng] = value.split(",").map(Number);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

function setLocationCookie(location: UserLocation) {
  document.cookie = `${COOKIE_NAME}=${location.lat},${location.lng}; max-age=${COOKIE_MAX_AGE}; path=/`;
}

/**
 * True only when running inside a real Telegram client. Outside Telegram the
 * web-app.js shim still exposes `window.Telegram.WebApp` (and a LocationManager
 * whose `init` callback never fires), so we must not rely on it in a browser.
 */
function isInsideTelegram(): boolean {
  const tg = window.Telegram?.WebApp;
  if (!tg) return false;
  return (
    (typeof tg.initData === "string" && tg.initData.length > 0) ||
    (typeof tg.platform === "string" && tg.platform !== "unknown")
  );
}

// Hard cap on the whole lookup so the loading screen can never hang, even if a
// platform API silently never calls back.
const LOCATION_TIMEOUT_MS = 12000;
const GEO_TIMEOUT_MS = 10000;

function requestFreshLocation(
  onSuccess: (loc: UserLocation) => void,
  onError: () => void
) {
  let settled = false;
  let timer: ReturnType<typeof setTimeout>;
  const succeed = (loc: UserLocation) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    onSuccess(loc);
  };
  const fail = () => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    onError();
  };

  // Safety net: if neither path resolves (e.g. Telegram's LocationManager.init
  // never calls back), give up so the caller can use the default location.
  timer = setTimeout(fail, LOCATION_TIMEOUT_MS);

  const fallbackToBrowser = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => succeed({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => fail(),
        // getCurrentPosition defaults to an infinite timeout — cap it.
        { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: 60000 }
      );
    } else {
      fail();
    }
  };

  const tgLocationManager = isInsideTelegram()
    ? window.Telegram?.WebApp?.LocationManager
    : undefined;

  if (tgLocationManager) {
    tgLocationManager.init(() => {
      if (settled) return;
      if (
        !tgLocationManager.isLocationAvailable ||
        !tgLocationManager.isAccessGranted
      ) {
        fallbackToBrowser();
        return;
      }
      tgLocationManager.getLocation((data) => {
        if (data) {
          succeed({ lat: data.latitude, lng: data.longitude });
        } else {
          fallbackToBrowser();
        }
      });
    });
  } else {
    fallbackToBrowser();
  }
}

export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(
    getLocationCookie
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (location) return;

    let cancelled = false;

    requestFreshLocation(
      (loc) => {
        if (cancelled) return;
        setLocationCookie(loc);
        setLocation(loc);
      },
      () => {
        if (cancelled) return;
        setLocationCookie(DEFAULT_LOCATION);
        setLocation(DEFAULT_LOCATION);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [location]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    requestFreshLocation(
      (loc) => {
        setLocationCookie(loc);
        setLocation(loc);
        setRefreshing(false);
      },
      () => {
        setRefreshing(false);
      }
    );
  }, []);

  return { location, refresh, refreshing };
}
