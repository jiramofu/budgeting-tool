import { Router, Response } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { TransactionCategorizer } from '../services/categorizer';
import { PermissionRequest, loadUserOrganizations } from '../middleware/permissions';
import { requireOrganization } from '../middleware/permissionHelper';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

console.log('[Import Routes] Loading import routes...');

interface CSVRow {
  [key: string]: string;
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
}

// Helper to detect date format and parse it
function parseDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Fall through to error handling
  }
  throw new Error(`Unable to parse date: ${dateStr}`);
}

// Helper to parse amount (handle various formats)
function parseAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) {
    throw new Error(`Unable to parse amount: ${amountStr}`);
  }
  return Math.abs(parsed); // Ensure positive amount
}

// CSV import endpoint
router.post(
  '/csv',
  authenticate,
  loadUserOrganizations,
  requireOrganization,
  upload.single('file'),
  async (req: PermissionRequest, res: Response) => {
  console.log('[Import] CSV upload received');
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { budgetId, categoryId, dateColumn, descriptionColumn, amountColumn } = req.body;

    const csv = req.file.buffer.toString('utf-8');
    const parseResult = Papa.parse(csv, { header: true, skipEmptyLines: true });

    if (parseResult.errors.length > 0) {
      console.error('[Import] CSV parse errors:', parseResult.errors);
      return res.status(400).json({ error: 'Invalid CSV format' });
    }

    const rows = parseResult.data as CSVRow[];
    console.log(`[Import] Parsed ${rows.length} rows from CSV`);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Validate required columns exist
    const firstRow = rows[0];
    if (!firstRow[dateColumn] || !firstRow[amountColumn] || !firstRow[descriptionColumn]) {
      return res.status(400).json({
        error: 'CSV columns not found. Please verify column names match your file.',
      });
    }

    const importedTransactions: ParsedTransaction[] = [];
    const errors: { row: number; error: string }[] = [];

    // Parse and validate each row
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const transaction: ParsedTransaction = {
          date: parseDate(row[dateColumn]),
          description: row[descriptionColumn]?.trim() || 'Imported transaction',
          amount: parseAmount(row[amountColumn]),
          category: row[categoryId] || undefined,
        };
        importedTransactions.push(transaction);
      } catch (error: any) {
        errors.push({ row: i + 1, error: error.message });
      }
    }

    if (errors.length > 0) {
      console.warn('[Import] Row parsing errors:', errors);
      return res.status(400).json({
        error: 'Some rows could not be parsed',
        details: errors.slice(0, 5), // Return first 5 errors
      });
    }

    // Insert transactions into database
    let successCount = 0;
    let duplicateCount = 0;

    for (const txn of importedTransactions) {
      try {
        // Check for duplicate (same date, description, amount within 5 seconds)
        const dupCheck = await query(
          `SELECT id FROM transactions
           WHERE user_id = $1
           AND organization_id = $2
           AND DATE(transaction_date) = $3
           AND description = $4
           AND amount = $5
           LIMIT 1`,
          [req.userId, req.organizationId, txn.date, txn.description, txn.amount]
        );

        if (dupCheck.rows.length > 0) {
          duplicateCount++;
          continue;
        }

        // Auto-suggest category if not provided
        let finalCategoryId = categoryId;
        if (!finalCategoryId && req.userId) {
          const suggestion = await TransactionCategorizer.suggestCategory(
            req.userId,
            txn.description,
            txn.amount
          );
          if (suggestion && suggestion.confidence > 0.6) {
            finalCategoryId = suggestion.categoryId.toString();
          }
        }

        // Insert the transaction
        await query(
          `INSERT INTO transactions
           (user_id, budget_id, category_id, amount, description, transaction_date, transaction_type, source, organization_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            req.userId,
            budgetId || null,
            finalCategoryId || null,
            txn.amount,
            txn.description,
            txn.date,
            'expense',
            'csv',
            req.organizationId,
          ]
        );
        successCount++;
      } catch (error: any) {
        console.error('[Import] Error inserting transaction:', error);
      }
    }

    console.log(`[Import] Import complete: ${successCount} imported, ${duplicateCount} duplicates skipped`);
    res.json({
      success: true,
      imported: successCount,
      duplicates: duplicateCount,
      total: importedTransactions.length,
    });
  } catch (error: any) {
    console.error('[Import] CSV import error:', error);
    res.status(500).json({ error: 'Failed to import CSV: ' + error.message });
  }
});

console.log('[Import Routes] Import routes loaded successfully');
export default router;
