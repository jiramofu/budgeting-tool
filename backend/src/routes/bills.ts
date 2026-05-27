import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { BillsService } from '../services/bills-service';

const router = Router();

console.log('[Bills Routes] Loading bills routes...');

// Get all bills
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Bills] GET all bills');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const bills = await BillsService.getBills(req.userId);
    res.json(bills);
  } catch (error: any) {
    console.error('[Bills] Error getting bills:', error);
    res.status(500).json({ error: 'Failed to get bills: ' + error.message });
  }
});

// Get bill summary
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Bills] GET summary');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await BillsService.getBillSummary(req.userId);
    res.json(summary);
  } catch (error: any) {
    console.error('[Bills] Error getting summary:', error);
    res.status(500).json({ error: 'Failed to get summary: ' + error.message });
  }
});

// Get upcoming bills (next 30 days)
router.get('/upcoming', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Bills] GET upcoming bills');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const bills = await BillsService.getUpcomingBills(req.userId, Math.min(days, 365));
    res.json(bills);
  } catch (error: any) {
    console.error('[Bills] Error getting upcoming bills:', error);
    res.status(500).json({ error: 'Failed to get upcoming bills: ' + error.message });
  }
});

// Get single bill
router.get('/:billId', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Bills] GET bill by id');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const billId = parseInt(req.params.billId);
    const bill = await BillsService.getBill(req.userId, billId);

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json(bill);
  } catch (error: any) {
    console.error('[Bills] Error getting bill:', error);
    res.status(500).json({ error: 'Failed to get bill: ' + error.message });
  }
});

// Create bill
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Bills] POST create bill');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, amount, dueDateDay, frequency, categoryId, notes } = req.body;

    if (!name || !amount || !dueDateDay || !frequency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bill = await BillsService.createBill(
      req.userId,
      name,
      amount,
      dueDateDay,
      frequency,
      categoryId,
      notes
    );

    res.status(201).json(bill);
  } catch (error: any) {
    console.error('[Bills] Error creating bill:', error);
    res.status(500).json({ error: 'Failed to create bill: ' + error.message });
  }
});

// Update bill
router.put('/:billId', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Bills] PUT update bill');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const billId = parseInt(req.params.billId);
    const bill = await BillsService.updateBill(req.userId, billId, req.body);

    res.json(bill);
  } catch (error: any) {
    console.error('[Bills] Error updating bill:', error);
    res.status(500).json({ error: 'Failed to update bill: ' + error.message });
  }
});

// Mark bill as paid
router.post('/:billId/mark-paid', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Bills] POST mark bill as paid');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const billId = parseInt(req.params.billId);
    const bill = await BillsService.markBillAsPaid(req.userId, billId);

    res.json(bill);
  } catch (error: any) {
    console.error('[Bills] Error marking bill as paid:', error);
    res.status(500).json({ error: 'Failed to mark bill as paid: ' + error.message });
  }
});

// Create transaction from bill
router.post('/:billId/create-transaction', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Bills] POST create transaction from bill');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const billId = parseInt(req.params.billId);
    await BillsService.createTransactionFromBill(req.userId, billId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Bills] Error creating transaction from bill:', error);
    res.status(500).json({ error: 'Failed to create transaction: ' + error.message });
  }
});

// Delete bill
router.delete('/:billId', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Bills] DELETE bill');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const billId = parseInt(req.params.billId);
    const success = await BillsService.deleteBill(req.userId, billId);

    if (!success) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Bills] Error deleting bill:', error);
    res.status(500).json({ error: 'Failed to delete bill: ' + error.message });
  }
});

console.log('[Bills Routes] Bills routes loaded successfully');
export default router;
