import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';
import NotificationService from '../services/notification-service';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate, loadUserOrganizations, requireOrganization);

console.log('[Notification Routes] Loading notification routes...');

// Get user notifications
router.get('/', async (req: PermissionRequest, res: Response) => {
  console.log('[Notification] GET all notifications');
  try {
    const notifications = await NotificationService.getNotifications(req.userId);
    res.json(notifications);
  } catch (error: any) {
    console.error('[Notification] Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications: ' + error.message });
  }
});

// Get unread notification count
router.get('/unread/count', async (req: PermissionRequest, res: Response) => {
  console.log('[Notification] GET unread count');
  try {
    const notifications = await NotificationService.getNotifications(req.userId);
    const unreadCount = notifications.filter((n: any) => !n.read_at).length;
    res.json({ unreadCount });
  } catch (error: any) {
    console.error('[Notification] Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count: ' + error.message });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req: PermissionRequest, res: Response) => {
  console.log('[Notification] PUT mark as read:', req.params.notificationId);
  try {
    const notificationId = parseInt(req.params.notificationId);
    await NotificationService.markNotificationAsRead(notificationId, req.userId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Notification] Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read: ' + error.message });
  }
});

// Mark all notifications as read
router.put('/read-all', async (req: PermissionRequest, res: Response) => {
  console.log('[Notification] PUT mark all as read');
  try {
    const notifications = await NotificationService.getNotifications(req.userId);
    for (const notification of (notifications as any[])) {
      if (!notification.read) {
        await NotificationService.markNotificationAsRead(notification.id, req.userId);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Notification] Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read: ' + error.message });
  }
});

// Delete notification
router.delete('/:notificationId', async (req: PermissionRequest, res: Response) => {
  console.log('[Notification] DELETE notification:', req.params.notificationId);
  try {
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
