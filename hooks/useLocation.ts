
import { useState, useEffect } from "react";
import useTelegramApp from "@/hooks/useTelegramApp";

const useLocation = () => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useTelegramApp();

  useEffect(() => {
    const requestLocation = async () => {
      if ("geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            }
          );

          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } catch (err) {
          if (err instanceof GeolocationPositionError) {
            switch (err.code) {
              case err.PERMISSION_DENIED:
                setError(
                  "Location permission denied. Please enable location services."
                );
                break;
              case err.POSITION_UNAVAILABLE:
                setError("Location information is unavailable.");
                break;
              case err.TIMEOUT:
                setError("The request to get user location timed out.");
                break;
              default:
                setError("An unknown error occurred.");
                break;
            }
          } else {
            setError("An unknown error occurred.");
          }
        }
      } else {
        setError("Geolocation is not supported by this browser.");
      }
    };

    if (user) {
      requestLocation();
    }
  }, [user]);

  return { location, error };
};

export default useLocation;
