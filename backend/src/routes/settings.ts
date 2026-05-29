import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { SettingsService } from '../services/settings-service';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'profile-pictures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthRequest).userId;
    const ext = path.extname(file.originalname);
    cb(null, `user-${userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

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
        organizationId: req.organizationId!,
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
    console.log('[Settings] POST user settings for user:', req.userId, 'org:', req.organizationId);
    console.log('[Settings] Request body:', req.body);
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const settings = await SettingsService.updateUserSettings(req.userId, req.body);
      // Add organization context to settings response
      const settingsWithOrg = {
        ...settings,
        organizationId: req.organizationId!,
      };
      console.log('[Settings] Settings updated successfully:', settingsWithOrg);
      res.json(settingsWithOrg);
    } catch (error: any) {
      console.error('[Settings] Error updating settings:', error);
      console.error('[Settings] Stack:', error.stack);
      res.status(500).json({ error: 'Failed to update settings: ' + error.message });
    }
  }
);

// Upload profile picture
router.post(
  '/profile-picture',
  authenticate,
  upload.single('file'),
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Settings] POST profile picture for user:', req.userId);
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Store the file path in the settings
      const fileUrl = `/uploads/profile-pictures/${req.file.filename}`;
      const settings = await SettingsService.updateUserSettings(req.userId, {
        profilePicture: fileUrl,
      });

      res.json({
        success: true,
        profilePictureUrl: fileUrl,
        settings,
      });
    } catch (error: any) {
      console.error('[Settings] Error uploading profile picture:', error);
      res.status(500).json({ error: 'Failed to upload profile picture: ' + error.message });
    }
  }
);

console.log('[Settings Routes] Settings routes loaded successfully');
export default router;
