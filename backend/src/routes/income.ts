import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { IncomeService } from '../services/income-service';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';

const router = Router();

console.log('[Income Routes] Loading income routes...');

// Get all income entries for user
router.get(
  '/',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Income] GET all income entries');
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const income = await IncomeService.getAllIncomeEntries(req.userId);
      res.json(income);
    } catch (error: any) {
      console.error('[Income] Error getting income entries:', error);
      res.status(500).json({ error: 'Failed to get income entries: ' + error.message });
    }
  }
);

// Get income for specific month/year
router.get(
  '/:month/:year',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Income] GET income by month/year');
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const month = parseInt(req.params.month);
      const year = parseInt(req.params.year);

      if (!month || month < 1 || month > 12 || !year) {
        return res.status(400).json({ error: 'Invalid month or year' });
      }

      const income = await IncomeService.getIncomeByMonth(req.userId, month, year);

      if (!income) {
        return res.status(404).json({ error: 'Income entry not found for this month/year' });
      }

      res.json(income);
    } catch (error: any) {
      console.error('[Income] Error getting income by month:', error);
      res.status(500).json({ error: 'Failed to get income: ' + error.message });
    }
  }
);

// Get income for a specific year
router.get(
  '/year/:year',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Income] GET income for year');
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const year = parseInt(req.params.year);

      if (!year) {
        return res.status(400).json({ error: 'Invalid year' });
      }

      const income = await IncomeService.getIncomeForYear(req.userId, year);
      res.json(income);
    } catch (error: any) {
      console.error('[Income] Error getting income for year:', error);
      res.status(500).json({ error: 'Failed to get income for year: ' + error.message });
    }
  }
);

// Get current month income
router.get(
  '/current/month',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Income] GET current month income');
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const income = await IncomeService.getCurrentMonthIncome(req.userId);

      if (!income) {
        return res.status(404).json({ error: 'No income entry for current month' });
      }

      res.json(income);
    } catch (error: any) {
      console.error('[Income] Error getting current month income:', error);
      res.status(500).json({ error: 'Failed to get income: ' + error.message });
    }
  }
);

// Create income entry
router.post(
  '/',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Income] POST create income entry');
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { gross_pay, net_pay, deductions, month, year, notes } = req.body;

      if (gross_pay === undefined || net_pay === undefined || deductions === undefined || !month || !year) {
        return res.status(400).json({ error: 'Missing required fields: gross_pay, net_pay, deductions, month, year' });
      }

      if (month < 1 || month > 12) {
        return res.status(400).json({ error: 'Invalid month (must be 1-12)' });
      }

      const income = await IncomeService.createIncome(
        req.userId,
        gross_pay,
        net_pay,
        deductions,
        month,
        year,
        notes
      );

      res.status(201).json(income);
    } catch (error: any) {
      console.error('[Income] Error creating income entry:', error);
      res.status(500).json({ error: 'Failed to create income entry: ' + error.message });
    }
  }
);

// Update income entry
router.put(
  '/:incomeId',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Income] PUT update income entry');
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const incomeId = parseInt(req.params.incomeId);

      const income = await IncomeService.updateIncome(req.userId, incomeId, req.body);

      res.json(income);
    } catch (error: any) {
      console.error('[Income] Error updating income entry:', error);
      res.status(500).json({ error: 'Failed to update income entry: ' + error.message });
    }
  }
);

// Delete income entry
router.delete(
  '/:incomeId',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  async (req: PermissionRequest, res: Response) => {
    console.log('[Income] DELETE income entry');
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const incomeId = parseInt(req.params.incomeId);

      const deleted = await IncomeService.deleteIncome(req.userId, incomeId);

      if (!deleted) {
        return res.status(404).json({ error: 'Income entry not found' });
      }

      res.json({ success: true, message: 'Income entry deleted' });
    } catch (error: any) {
      console.error('[Income] Error deleting income entry:', error);
      res.status(500).json({ error: 'Failed to delete income entry: ' + error.message });
    }
  }
);

export default router;
