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

function requestFreshLocation(
  onSuccess: (loc: UserLocation) => void,
  onError: () => void
) {
  const fallbackToBrowser = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          onSuccess({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => onError()
      );
    } else {
      onError();
    }
  };

  const tgLocationManager = window.Telegram?.WebApp?.LocationManager;

  if (tgLocationManager) {
    tgLocationManager.init(() => {
      if (
        !tgLocationManager.isLocationAvailable ||
        !tgLocationManager.isAccessGranted
      ) {
        fallbackToBrowser();
        return;
      }
      tgLocationManager.getLocation((data) => {
        if (data) {
          onSuccess({ lat: data.latitude, lng: data.longitude });
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
