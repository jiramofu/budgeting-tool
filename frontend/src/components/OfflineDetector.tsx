import React, { useEffect, useState } from 'react';

export const OfflineDetector: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
      <span>📡</span>
      <span>You appear to be offline. Some features may not work.</span>
    </div>
  );
};

export default OfflineDetector;
