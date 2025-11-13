// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { OfflineDetector } from '@/lib/offlineDetector';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(OfflineDetector.getStatus());
  const [showMockData, setShowMockData] = useState(false);

  useEffect(() => {
    const unsubscribe = OfflineDetector.addListener((online) => {
      setIsOnline(online);
      setShowMockData(!online);
    });

    // Check initial state
    setShowMockData(!OfflineDetector.getStatus());

    return unsubscribe;
  }, []);

  if (!showMockData && isOnline) {
    return null;
  }

  return (
    isOnline && (
      <div className="fixed bottom-4 right-4 z-50 bg-warning/90 text-warning-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-fadeIn">
        <Wifi className="h-4 w-4" />
        <span>Online - Connected</span>
      </div>
    )
  );
  
};

