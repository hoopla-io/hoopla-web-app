import { useState, useEffect } from 'react';

import Cookies from 'js-cookie';

const useLocation = () => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestLocation = async () => {
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });

          const tenMinutes = new Date(new Date().getTime() + 5 * 60 * 1000);

          Cookies.set('latitude', String(position.coords.latitude), {
            expires: tenMinutes,
          });
          Cookies.set('longitude', String(position.coords.longitude), {
            expires: tenMinutes,
          });

          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } catch (err) {
          if (err instanceof GeolocationPositionError) {
            switch (err.code) {
              case err.PERMISSION_DENIED:
                setError('Location permission denied. Please enable location services.');
                break;
              case err.POSITION_UNAVAILABLE:
                setError('Location information is unavailable.');
                break;
              case err.TIMEOUT:
                setError('The request to get user location timed out.');
                break;
              default:
                setError('An unknown error occurred.');
                break;
            }
          } else {
            setError('An unknown error occurred.');
          }
        }
      } else {
        setError('Geolocation is not supported by this browser.');
      }
    };

    if (Cookies.get('latitude') && Cookies.get('longitude')) {
      setLocation({
        latitude: Number(Cookies.get('latitude')),
        longitude: Number(Cookies.get('longitude')),
      });
      return;
    }

    if (!location) {
      requestLocation();
    }
  }, []);

  const refreshLocation = () => {
    setLocation(null);
    setError(null);
  };

  return { location, error, refreshLocation };
};

export default useLocation;
