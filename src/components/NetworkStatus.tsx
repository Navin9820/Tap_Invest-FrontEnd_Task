import React from 'react';
import { Wifi, WifiOff, Signal } from 'lucide-react';

interface NetworkStatusProps {
  networkInfo: any;
  isOnline: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ networkInfo, isOnline }) => {
  const getConnectionQuality = () => {
    if (!networkInfo || !isOnline) return 'offline';
    
    const effectiveType = networkInfo.effectiveType;
    switch (effectiveType) {
      case 'slow-2g':
        return 'poor';
      case '2g':
        return 'fair';
      case '3g':
        return 'good';
      case '4g':
        return 'excellent';
      default:
        return 'good';
    }
  };

  const getConnectionColor = () => {
    const quality = getConnectionQuality();
    switch (quality) {
      case 'offline':
        return 'text-red-400';
      case 'poor':
        return 'text-red-400';
      case 'fair':
        return 'text-yellow-400';
      case 'good':
        return 'text-green-400';
      case 'excellent':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getConnectionText = () => {
    if (!isOnline) return 'Offline';
    if (!networkInfo) return 'Online';
    
    const quality = getConnectionQuality();
    const type = networkInfo.effectiveType?.toUpperCase() || 'UNKNOWN';
    
    return `${type} (${quality})`;
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`flex items-center space-x-1 ${getConnectionColor()}`}>
        {isOnline ? (
          <Signal className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <span>{getConnectionText()}</span>
      </div>
      
      {networkInfo && isOnline && (
        <div className="text-xs text-gray-400">
          {networkInfo.downlink && `${networkInfo.downlink}Mbps`}
          {networkInfo.rtt && ` • ${networkInfo.rtt}ms`}
        </div>
      )}
    </div>
  );
};

export default NetworkStatus;