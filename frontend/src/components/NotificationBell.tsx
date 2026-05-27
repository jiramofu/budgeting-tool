import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await apiClient.get('/notifications/unread/count');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleViewNotifications = () => {
    setShowDropdown(false);
    navigate('/notifications');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition"
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {unreadCount === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No unread notifications</p>
              </div>
            ) : (
              <div className="p-2">
                <p className="text-sm text-gray-600 p-2">
                  You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
                </p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200">
            <button
              onClick={handleViewNotifications}
              className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
