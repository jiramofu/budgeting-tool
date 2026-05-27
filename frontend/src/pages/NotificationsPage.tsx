import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
  data?: Record<string, any>;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/notifications');
      setNotifications(response.data || []);

      const unread = (response.data || []).filter((n: Notification) => !n.read_at).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'budget_alert':
        return '⚠️';
      case 'transaction':
        return '💳';
      case 'goal_update':
        return '🎯';
      case 'welcome':
        return '👋';
      case 'monthly_report':
        return '📊';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'budget_alert':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'transaction':
        return 'border-l-4 border-blue-500 bg-blue-50';
      case 'goal_update':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'monthly_report':
        return 'border-l-4 border-purple-500 bg-purple-50';
      default:
        return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </span>
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔔</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No notifications yet</h2>
          <p className="text-gray-500">
            You'll receive notifications about budget alerts, transactions, and reports here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg ${getNotificationColor(
                notification.type
              )} ${!notification.read_at ? 'border-l-4 border-opacity-100' : 'opacity-60'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatDate(notification.created_at)}</p>
                  </div>
                </div>
                {!notification.read_at && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="ml-4 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition whitespace-nowrap"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
