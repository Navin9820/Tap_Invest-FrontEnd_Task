import { useState, useEffect, useCallback } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  const watchIdRef = { current: null as number | null };

  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Geolocation is not supported', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    };

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation(position);
      setAccuracy(position.coords.accuracy);
      setError(null);
    };

    const handleError = (err: GeolocationPositionError) => {
      setError(err);
      console.error('Geolocation error:', err);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    setIsWatching(true);
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    location,
    error,
    accuracy,
    isWatching,
    watchPosition,
    stopWatching
  };
};