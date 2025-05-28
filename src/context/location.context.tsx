import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { locationManager } from "@telegram-apps/sdk-react";
import { Button } from "@telegram-apps/telegram-ui";

type Location = {
  latitude: number;
  longitude: number;
} | null;

type LocationContextType = {
  location: Location;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
};

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [location, setLocation] = useState<Location>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!locationManager.mount.isAvailable()) {
        throw new Error("Location permission is not available in Telegram");
      }

      await locationManager.mount();

      const loc = await locationManager.requestLocation();

      setLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to access location");
      locationManager.mountError?.(); // optional fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLocation = useCallback(async () => {
    try {
      const loc = await locationManager.requestLocation();
      setLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to access location");
      locationManager.mountError?.();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!locationManager.isMounted()) {
      requestLocation();
    }

    if (locationManager.isMounted()) {
      getLocation();
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{ location, isLoading, error, requestLocation }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};

export const LocationSettings = () => {
  return (
    <Button className="w-full" onClick={locationManager.openSettings}>
      Give location access
    </Button>
  );
};
