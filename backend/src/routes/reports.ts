import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import ReportService from '../services/report-service';

const router = Router();

console.log('[Report Routes] Loading report routes...');

// Generate monthly PDF report
router.get('/monthly/pdf', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Report] GET monthly PDF');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { month, year } = req.query;
    const reportMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const reportYear = year ? parseInt(year as string) : new Date().getFullYear();

    const pdfBuffer = await ReportService.generateMonthlyPDFReport(
      req.userId,
      reportMonth,
      reportYear
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="budget-report-${reportYear}-${String(reportMonth).padStart(2, '0')}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('[Report] Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
  }
});

// Generate monthly CSV report
router.get('/monthly/csv', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Report] GET monthly CSV');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { month, year } = req.query;
    const reportMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const reportYear = year ? parseInt(year as string) : new Date().getFullYear();

    const csvContent = await ReportService.generateMonthlyCSVReport(
      req.userId,
      reportMonth,
      reportYear
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="budget-report-${reportYear}-${String(reportMonth).padStart(2, '0')}.csv"`
    );
    res.send(csvContent);
  } catch (error: any) {
    console.error('[Report] Error generating CSV:', error);
    res.status(500).json({ error: 'Failed to generate CSV: ' + error.message });
  }
});

// Generate annual CSV report
router.get('/annual/csv', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Report] GET annual CSV');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { year } = req.query;
    const reportYear = year ? parseInt(year as string) : new Date().getFullYear();

    const csvContent = await ReportService.generateAnnualCSVReport(req.userId, reportYear);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="annual-report-${reportYear}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    console.error('[Report] Error generating annual CSV:', error);
    res.status(500).json({ error: 'Failed to generate annual CSV: ' + error.message });
  }
});

// Generate spending trends CSV
router.get('/spending-trends/csv', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Report] GET spending trends CSV');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { months = '12' } = req.query;
    const monthsBack = parseInt(months as string);

    const csvContent = await ReportService.generateSpendingTrendCSV(req.userId, monthsBack);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="spending-trends-${monthsBack}m.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    console.error('[Report] Error generating trends CSV:', error);
    res.status(500).json({ error: 'Failed to generate trends CSV: ' + error.message });
  }
});

// Get report metadata
router.get('/metadata', authenticate, async (req: AuthRequest, res: Response) => {
  console.log('[Report] GET metadata');
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const currentDate = new Date();
    res.json({
      currentMonth: currentDate.getMonth() + 1,
      currentYear: currentDate.getFullYear(),
      availableYears: [currentDate.getFullYear(), currentDate.getFullYear() - 1],
      trendMonths: [3, 6, 12],
    });
  } catch (error: any) {
    console.error('[Report] Error getting metadata:', error);
    res.status(500).json({ error: 'Failed to get metadata: ' + error.message });
  }
});

console.log('[Report Routes] Report routes loaded successfully');
export default router;
