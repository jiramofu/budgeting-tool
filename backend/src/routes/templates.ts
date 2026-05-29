import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';
import { TemplatesService } from '../services/templates-service';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate, loadUserOrganizations, requireOrganization);

console.log('[Templates Routes] Loading templates routes...');

// Get all budget templates
router.get('/', async (req: PermissionRequest, res: Response) => {
  console.log('[Templates] GET all templates');
  try {
    const templates = TemplatesService.getTemplates();
    res.json(templates);
  } catch (error: any) {
    console.error('[Templates] Error getting templates:', error);
    res.status(500).json({ error: 'Failed to get templates: ' + error.message });
  }
});

// Get single template
router.get('/:templateId', async (req: PermissionRequest, res: Response) => {
  console.log('[Templates] GET template by id');
  try {
    const { templateId } = req.params;
    const template = TemplatesService.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error: any) {
    console.error('[Templates] Error getting template:', error);
    res.status(500).json({ error: 'Failed to get template: ' + error.message });
  }
});

// Apply template to budget
router.post('/:templateId/apply', async (req: PermissionRequest, res: Response) => {
  console.log('[Templates] POST apply template');
  try {

    const { templateId } = req.params;
    const { budgetId } = req.body;

    if (!budgetId) {
      return res.status(400).json({ error: 'Budget ID is required' });
    }

    const result = await TemplatesService.applyTemplate(req.userId, templateId, budgetId, req.organizationId!);
    res.status(201).json({ success: true, categories: result });
  } catch (error: any) {
    console.error('[Templates] Error applying template:', error);
    res.status(500).json({ error: 'Failed to apply template: ' + error.message });
  }
});

// Get suggested categories based on transaction history
router.get('/suggestions/categories', async (req: PermissionRequest, res: Response) => {
  console.log('[Templates] GET category suggestions');
  try {

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const suggestions = await TemplatesService.suggestCategories(req.userId, Math.min(limit, 50), req.organizationId!);

    res.json(suggestions);
  } catch (error: any) {
    console.error('[Templates] Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions: ' + error.message });
  }
});

// Get category statistics
router.get('/stats/categories', async (req: PermissionRequest, res: Response) => {
  console.log('[Templates] GET category stats');
  try {

    const stats = await TemplatesService.getCategoryStats(req.userId, req.organizationId!);
    res.json(stats);
  } catch (error: any) {
    console.error('[Templates] Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats: ' + error.message });
  }
});

console.log('[Templates Routes] Templates routes loaded successfully');
export default router;
