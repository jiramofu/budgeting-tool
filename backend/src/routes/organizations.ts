import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  requireRole,
  loadUserOrganizations,
  validateOrganizationAccess,
  checkPermission,
} from '../middleware/permissions';
import * as organizationService from '../services/organizationService';
import { PermissionRequest } from '../middleware/permissions';
import { Response } from 'express';

const router = Router();

/**
 * Get all organizations for authenticated user
 * GET /api/organizations
 */
router.get('/', authenticate, async (req: PermissionRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const organizations = await organizationService.getUserOrganizations(req.userId);
    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

/**
 * Get single organization details
 * GET /api/organizations/:id
 */
router.get('/:id', authenticate, validateOrganizationAccess, async (req: PermissionRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const organizationId = parseInt(req.params.id);

    // Validate user has access to this organization
    const isMember = await organizationService.isOrganizationMember(req.userId, organizationId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const organization = await organizationService.getOrganization(organizationId);
    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

/**
 * Create new organization
 * POST /api/organizations
 */
router.post('/', authenticate, async (req: PermissionRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, type = 'team', description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    const validTypes = ['personal', 'team', 'enterprise'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid organization type' });
    }

    const organization = await organizationService.createOrganization(
      req.userId,
      name,
      type,
      description
    );

    res.status(201).json(organization);
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

/**
 * Update organization
 * PUT /api/organizations/:id
 */
router.put(
  '/:id',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const organizationId = parseInt(req.params.id);
      const { name, description, logo_url, settings, is_active } = req.body;

      const organization = await organizationService.updateOrganization(
        organizationId,
        {
          name,
          description,
          logo_url,
          settings,
          is_active,
        },
        req.userId
      );

      res.json(organization);
    } catch (error) {
      console.error('Error updating organization:', error);
      res.status(500).json({ error: 'Failed to update organization' });
    }
  }
);

/**
 * Get organization members
 * GET /api/organizations/:id/members
 */
router.get('/:id/members', authenticate, validateOrganizationAccess, async (req: PermissionRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const organizationId = parseInt(req.params.id);
    const members = await organizationService.getOrganizationMembers(organizationId);

    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

/**
 * Add member to organization
 * POST /api/organizations/:id/members
 */
router.post(
  '/:id/members',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const organizationId = parseInt(req.params.id);
      const { userId, role = 'user' } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const validRoles = ['admin', 'manager', 'user', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const member = await organizationService.addOrganizationMember(
        organizationId,
        userId,
        role,
        req.userId
      );

      res.status(201).json(member);
    } catch (error) {
      console.error('Error adding member:', error);
      res.status(500).json({ error: 'Failed to add member' });
    }
  }
);

/**
 * Update member role
 * PUT /api/organizations/:id/members/:userId
 */
router.put(
  '/:id/members/:userId',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const organizationId = parseInt(req.params.id);
      const targetUserId = parseInt(req.params.userId);
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ error: 'Role is required' });
      }

      const validRoles = ['owner', 'admin', 'manager', 'user', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const member = await organizationService.updateMemberRole(
        organizationId,
        targetUserId,
        role as any,
        req.userId
      );

      res.json(member);
    } catch (error) {
      console.error('Error updating member role:', error);
      res.status(500).json({ error: 'Failed to update member role' });
    }
  }
);

/**
 * Remove member from organization
 * DELETE /api/organizations/:id/members/:userId
 */
router.delete(
  '/:id/members/:userId',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const organizationId = parseInt(req.params.id);
      const targetUserId = parseInt(req.params.userId);

      // Prevent removing yourself as owner
      if (targetUserId === req.userId) {
        const role = await organizationService.getMemberRole(req.userId, organizationId);
        if (role === 'owner') {
          return res.status(400).json({
            error: 'Owner cannot remove themselves. Transfer ownership first.',
          });
        }
      }

      await organizationService.removeMember(organizationId, targetUserId, req.userId);

      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ error: 'Failed to remove member' });
    }
  }
);

/**
 * Get rate limit status
 * GET /api/organizations/:id/rate-limits
 */
router.get(
  '/:id/rate-limits',
  authenticate,
  validateOrganizationAccess,
  requireRole(['owner', 'admin']),
  async (req: PermissionRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Import rate limit service
      const { getRateLimitStatus } = await import('../middleware/rateLimit');
      const organizationId = parseInt(req.params.id);

      const status = await getRateLimitStatus(organizationId);
      res.json(status);
    } catch (error) {
      console.error('Error fetching rate limit status:', error);
      res.status(500).json({ error: 'Failed to fetch rate limit status' });
    }
  }
);

export default router;
