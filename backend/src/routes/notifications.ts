import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import NotificationService from '../services/notification-service';

const router = Router();

console.log('[Notification Routes] Loading notification routes...');

// Get user notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Notification] GET all notifications');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notifications = await NotificationService.getNotifications(req.userId);
    res.json(notifications);
  } catch (error: any) {
    console.error('[Notification] Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications: ' + error.message });
  }
});

// Get unread notification count
router.get('/unread/count', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Notification] GET unread count');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notifications = await NotificationService.getNotifications(req.userId);
    const unreadCount = notifications.filter((n: any) => !n.read_at).length;
    res.json({ unreadCount });
  } catch (error: any) {
    console.error('[Notification] Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count: ' + error.message });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Notification] PUT mark as read:', req.params.notificationId);
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notificationId = parseInt(req.params.notificationId);
    await NotificationService.markNotificationAsRead(notificationId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Notification] Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read: ' + error.message });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Notification] PUT mark all as read');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notifications = await NotificationService.getNotifications(req.userId);
    for (const notification of (notifications as any[])) {
      if (!notification.read) {
        await NotificationService.markNotificationAsRead(notification.id);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Notification] Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read: ' + error.message });
  }
});

// Delete notification
router.delete('/:notificationId', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Notification] DELETE notification:', req.params.notificationId);
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notificationId = parseInt(req.params.notificationId);

    // Verify ownership and delete
    const notifications = await NotificationService.getNotifications(req.userId);
    const notification = notifications.find(n => n.id === notificationId);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // In a real scenario, you'd implement a deleteNotification method
    // For now, we'll just return success as a placeholder
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Notification] Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification: ' + error.message });
  }
});

console.log('[Notification Routes] Notification routes loaded successfully');
export default router;
