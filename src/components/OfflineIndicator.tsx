import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Cloud, CloudOff, FolderSync as Sync } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingSyncCount?: number;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOnline, pendingSyncCount = 0 }) => {
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<number | null>(null);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true);
      if (lastOnlineTime === null) {
        setLastOnlineTime(Date.now());
      }
    } else {
      setShowOfflineMessage(false);
      setLastOnlineTime(null);
    }
  }, [isOnline, lastOnlineTime]);

  const getOfflineDuration = () => {
    if (!lastOnlineTime) return '';
    
    const duration = Date.now() - lastOnlineTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (!showOfflineMessage && pendingSyncCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`
        backdrop-blur-md rounded-xl p-4 border transition-all duration-300
        ${!isOnline 
          ? 'bg-red-500/20 border-red-400/30 text-red-300' 
          : 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300'
        }
        ${showOfflineMessage || pendingSyncCount > 0 ? 'animate-slideInDown' : 'animate-slideOutUp'}
      `}>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {!isOnline ? (
              <WifiOff className="w-5 h-5 animate-pulse" />
            ) : (
              <Wifi className="w-5 h-5" />
            )}
            
            <div>
              {!isOnline ? (
                <div>
                  <div className="font-semibold text-sm">You're offline</div>
                  <div className="text-xs opacity-80">
                    Offline for {getOfflineDuration()}
                  </div>
                </div>
              ) : pendingSyncCount > 0 ? (
                <div>
                  <div className="font-semibold text-sm flex items-center">
                    <Sync className="w-4 h-4 mr-1 animate-spin" />
                    Syncing data...
                  </div>
                  <div className="text-xs opacity-80">
                    {pendingSyncCount} item{pendingSyncCount !== 1 ? 's' : ''} pending
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {!isOnline && (
            <div className="flex items-center space-x-1 text-xs">
              <CloudOff className="w-4 h-4" />
              <span>Data saved locally</span>
            </div>
          )}
        </div>

        {!isOnline && (
          <div className="mt-2 text-xs opacity-80">
            Your workouts are being saved locally and will sync when you're back online.
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;