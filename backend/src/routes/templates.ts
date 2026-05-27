import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { TemplatesService } from '../services/templates-service';

const router = Router();

console.log('[Templates Routes] Loading templates routes...');

// Get all budget templates
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
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
router.get('/:templateId', authenticate, async (req: AuthRequest, res: Response) => {
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
router.post('/:templateId/apply', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Templates] POST apply template');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { templateId } = req.params;
    const { budgetId } = req.body;

    if (!budgetId) {
      return res.status(400).json({ error: 'Budget ID is required' });
    }

    const result = await TemplatesService.applyTemplate(req.userId, templateId, budgetId);
    res.status(201).json({ success: true, categories: result });
  } catch (error: any) {
    console.error('[Templates] Error applying template:', error);
    res.status(500).json({ error: 'Failed to apply template: ' + error.message });
  }
});

// Get suggested categories based on transaction history
router.get('/suggestions/categories', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Templates] GET category suggestions');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const suggestions = await TemplatesService.suggestCategories(req.userId, Math.min(limit, 50));

    res.json(suggestions);
  } catch (error: any) {
    console.error('[Templates] Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions: ' + error.message });
  }
});

// Get category statistics
router.get('/stats/categories', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Templates] GET category stats');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await TemplatesService.getCategoryStats(req.userId);
    res.json(stats);
  } catch (error: any) {
    console.error('[Templates] Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats: ' + error.message });
  }
});

console.log('[Templates Routes] Templates routes loaded successfully');
export default router;
