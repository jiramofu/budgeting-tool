import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { SettingsService } from '../services/settings-service';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';

const router = Router();

console.log('[Settings Routes] Loading settings routes...');

// Get user settings
router.get(
  '/',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Settings] GET user settings');
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const settings = await SettingsService.getUserSettings(req.userId);
      // Add organization context to settings response
      const settingsWithOrg = {
        ...settings,
        organizationId: req.organizationId,
      };
      res.json(settingsWithOrg);
    } catch (error: any) {
      console.error('[Settings] Error getting settings:', error);
      res.status(500).json({ error: 'Failed to get settings: ' + error.message });
    }
  }
);

// Update user settings
router.post(
  '/',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Settings] POST user settings');
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const settings = await SettingsService.updateUserSettings(req.userId, req.body);
      // Add organization context to settings response
      const settingsWithOrg = {
        ...settings,
        organizationId: req.organizationId,
      };
      res.json(settingsWithOrg);
    } catch (error: any) {
      console.error('[Settings] Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings: ' + error.message });
    }
  }
);

console.log('[Settings Routes] Settings routes loaded successfully');
export default router;
