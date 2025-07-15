import { useState, useEffect } from 'react';

interface NetworkInfo {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
}

export const useNetworkInfo = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setNetworkInfo({
          downlink: connection.downlink,
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Initial check
    updateNetworkInfo();

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network change listener
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return {
    networkInfo,
    isOnline
  };
};