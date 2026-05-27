import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { searchService } from '../services/searchService';

const router = Router();

// Middleware
router.use(authenticate);

/**
 * POST /api/search
 * Advanced transaction search with filters
 */
router.post('/', async (req: Request, res: Response) => {
  console.log('[Search] POST /search called');
  try {
    const userId = (req as any).userId;
    console.log('[Search] userId:', userId);
    const { filters, limit = 50, offset = 0 } = req.body;

    if (!filters || typeof filters !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid filters provided' });
    }

    const result = await searchService.searchTransactions(userId, filters, limit, offset);

    res.json({
      success: true,
      data: {
        results: result.results,
        total: result.total,
        hasMore: offset + limit < result.total,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Failed to search transactions' });
  }
});

/**
 * GET /api/search/suggestions
 * Get autocomplete suggestions for search
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { term, limit = 10 } = req.query;

    if (!term || typeof term !== 'string') {
      return res.status(400).json({ success: false, error: 'Search term required' });
    }

    const suggestions = await searchService.getSearchSuggestions(
      userId,
      term,
      parseInt(limit as string) || 10
    );

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get suggestions' });
  }
});

/**
 * POST /api/search/saved
 * Save a search query
 */
router.post('/saved', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, filters, description } = req.body;

    if (!name || !filters) {
      return res.status(400).json({ success: false, error: 'Name and filters required' });
    }

    const saved = await searchService.saveSearch(userId, name, filters, description);

    res.json({
      success: true,
      data: saved,
    });
  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({ success: false, error: 'Failed to save search' });
  }
});

/**
 * GET /api/search/saved
 * Get user's saved searches
 */
router.get('/saved', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const searches = await searchService.getSavedSearches(userId);

    res.json({
      success: true,
      data: { searches },
    });
  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({ success: false, error: 'Failed to get saved searches' });
  }
});

/**
 * DELETE /api/search/saved/:searchId
 * Delete a saved search
 */
router.delete('/saved/:searchId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { searchId } = req.params;

    const deleted = await searchService.deleteSearch(userId, parseInt(searchId));

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Search not found' });
    }

    res.json({
      success: true,
      data: { message: 'Search deleted' },
    });
  } catch (error) {
    console.error('Delete search error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete search' });
  }
});

/**
 * PUT /api/search/saved/:searchId/favorite
 * Toggle search as favorite
 */
router.put('/saved/:searchId/favorite', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { searchId } = req.params;

    const toggled = await searchService.toggleSearchFavorite(userId, parseInt(searchId));

    if (!toggled) {
      return res.status(404).json({ success: false, error: 'Search not found' });
    }

    res.json({
      success: true,
      data: { message: 'Favorite toggled' },
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle favorite' });
  }
});

/**
 * GET /api/search/popular
 * Get popular search terms (anonymous)
 */
router.get('/popular', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const terms = await searchService.getPopularSearchTerms(parseInt(limit as string) || 10);

    res.json({
      success: true,
      data: { terms },
    });
  } catch (error) {
    console.error('Popular terms error:', error);
    res.status(500).json({ success: false, error: 'Failed to get popular terms' });
  }
});

export default router;
