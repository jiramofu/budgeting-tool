import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  source?: string;
}

interface BudgetSummary {
  category: string;
  target: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
}

interface FinancialGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  progress: number;
}

interface ReportData {
  month: string;
  income: number;
  expenses: number;
  netCashFlow: number;
  savingsRate: number;
  topCategories: Array<{ category: string; amount: number }>;
}

/**
 * Export transactions to Excel file
 */
export const exportTransactionsToExcel = (
  transactions: Transaction[],
  fileName: string = 'transactions.xlsx'
) => {
  const worksheet = XLSX.utils.json_to_sheet(
    transactions.map((t) => ({
      Date: new Date(t.date).toLocaleDateString(),
      Description: t.description,
      Category: t.category,
      Amount: `$${Math.abs(t.amount).toFixed(2)}`,
      Type: t.amount >= 0 ? 'Income' : 'Expense',
      Source: t.source || 'Manual',
    }))
  );

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Date
    { wch: 25 }, // Description
    { wch: 15 }, // Category
    { wch: 12 }, // Amount
    { wch: 10 }, // Type
    { wch: 12 }, // Source
  ];

  // Format header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4B5563' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

  XLSX.writeFile(workbook, fileName);
};

/**
 * Export budget summary to Excel file
 */
export const exportBudgetSummaryToExcel = (
  budgetData: BudgetSummary[],
  month: string,
  fileName: string = 'budget-summary.xlsx'
) => {
  const worksheet = XLSX.utils.json_to_sheet(
    budgetData.map((b) => ({
      Category: b.category,
      'Target Amount': `$${b.target.toFixed(2)}`,
      'Spent Amount': `$${b.spent.toFixed(2)}`,
      'Remaining': `$${Math.max(0, b.remaining).toFixed(2)}`,
      'Percentage Used': `${b.percentageUsed.toFixed(1)}%`,
      Status: b.percentageUsed > 100 ? 'Over Budget' : b.percentageUsed > 80 ? 'Warning' : 'On Track',
    }))
  );

  // Set column widths
  worksheet['!cols'] = [
    { wch: 18 }, // Category
    { wch: 15 }, // Target
    { wch: 15 }, // Spent
    { wch: 15 }, // Remaining
    { wch: 15 }, // Percentage
    { wch: 12 }, // Status
  ];

  // Format header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4B5563' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
  }

  // Format data rows with conditional colors
  for (let row = 1; row < budgetData.length + 1; row++) {
    const statusCell = XLSX.utils.encode_cell({ r: row, c: 5 });
    if (worksheet[statusCell]) {
      const status = budgetData[row - 1].percentageUsed;
      if (status > 100) {
        worksheet[statusCell].s = {
          fill: { fgColor: { rgb: 'FF6B6B' } },
          font: { color: { rgb: 'FFFFFF' }, bold: true },
        };
      } else if (status > 80) {
        worksheet[statusCell].s = {
          fill: { fgColor: { rgb: 'FFA500' } },
          font: { color: { rgb: 'FFFFFF' }, bold: true },
        };
      } else {
        worksheet[statusCell].s = {
          fill: { fgColor: { rgb: '51CF66' } },
          font: { color: { rgb: 'FFFFFF' }, bold: true },
        };
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Budget - ${month}`);

  XLSX.writeFile(workbook, fileName);
};

/**
 * Export financial goals to Excel file
 */
export const exportGoalsToExcel = (
  goals: FinancialGoal[],
  fileName: string = 'financial-goals.xlsx'
) => {
  const worksheet = XLSX.utils.json_to_sheet(
    goals.map((g) => ({
      'Goal Name': g.name,
      'Target Amount': `$${g.targetAmount.toFixed(2)}`,
      'Current Amount': `$${g.currentAmount.toFixed(2)}`,
      'Remaining': `$${Math.max(0, g.targetAmount - g.currentAmount).toFixed(2)}`,
      'Progress': `${g.progress.toFixed(1)}%`,
      'Target Date': new Date(g.targetDate).toLocaleDateString(),
      Status: g.progress >= 100 ? 'Completed' : g.progress >= 50 ? 'In Progress' : 'Starting',
    }))
  );

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Goal Name
    { wch: 15 }, // Target
    { wch: 15 }, // Current
    { wch: 15 }, // Remaining
    { wch: 12 }, // Progress
    { wch: 15 }, // Target Date
    { wch: 15 }, // Status
  ];

  // Format header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4B5563' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Goals');

  XLSX.writeFile(workbook, fileName);
};

/**
 * Export spending report to Excel file
 */
export const exportSpendingReportToExcel = (
  reportData: ReportData[],
  fileName: string = 'spending-report.xlsx'
) => {
  // Create summary sheet
  const summarySheet = XLSX.utils.json_to_sheet(
    reportData.map((r) => ({
      Month: r.month,
      Income: `$${r.income.toFixed(2)}`,
      Expenses: `$${r.expenses.toFixed(2)}`,
      'Net Cash Flow': `$${r.netCashFlow.toFixed(2)}`,
      'Savings Rate': `${r.savingsRate.toFixed(1)}%`,
    }))
  );

  // Set column widths for summary
  summarySheet['!cols'] = [
    { wch: 12 }, // Month
    { wch: 15 }, // Income
    { wch: 15 }, // Expenses
    { wch: 15 }, // Net Cash Flow
    { wch: 15 }, // Savings Rate
  ];

  // Format header row
  const headerRange = XLSX.utils.decode_range(summarySheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (summarySheet[cellAddress]) {
      summarySheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4B5563' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
  }

  // Create details sheet with top categories
  const detailedData: Array<{ Month: string; Category: string; Amount: string }> = [];
  reportData.forEach((r) => {
    r.topCategories.forEach((cat) => {
      detailedData.push({
        Month: r.month,
        Category: cat.category,
        Amount: `$${cat.amount.toFixed(2)}`,
      });
    });
  });

  const detailsSheet = XLSX.utils.json_to_sheet(detailedData);
  detailsSheet['!cols'] = [
    { wch: 12 }, // Month
    { wch: 20 }, // Category
    { wch: 15 }, // Amount
  ];

  // Format header row for details
  const detailsHeaderRange = XLSX.utils.decode_range(detailsSheet['!ref'] || 'A1');
  for (let col = detailsHeaderRange.s.c; col <= detailsHeaderRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (detailsSheet[cellAddress]) {
      detailsSheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4B5563' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Category Details');

  XLSX.writeFile(workbook, fileName);
};

/**
 * Create a comprehensive financial snapshot export
 */
export const exportFinancialSnapshotToExcel = (
  data: {
    transactions: Transaction[];
    budgets: BudgetSummary[];
    goals: FinancialGoal[];
    report: ReportData[];
  },
  fileName: string = 'financial-snapshot.xlsx'
) => {
  const workbook = XLSX.utils.book_new();

  // Transactions sheet
  const transactionsSheet = XLSX.utils.json_to_sheet(
    data.transactions.map((t) => ({
      Date: new Date(t.date).toLocaleDateString(),
      Description: t.description,
      Category: t.category,
      Amount: `$${Math.abs(t.amount).toFixed(2)}`,
      Type: t.amount >= 0 ? 'Income' : 'Expense',
    }))
  );
  transactionsSheet['!cols'] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
  ];

  // Budget sheet
  const budgetSheet = XLSX.utils.json_to_sheet(
    data.budgets.map((b) => ({
      Category: b.category,
      'Target Amount': `$${b.target.toFixed(2)}`,
      'Spent Amount': `$${b.spent.toFixed(2)}`,
      'Remaining': `$${Math.max(0, b.remaining).toFixed(2)}`,
      'Percentage Used': `${b.percentageUsed.toFixed(1)}%`,
    }))
  );
  budgetSheet['!cols'] = [
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  // Goals sheet
  const goalsSheet = XLSX.utils.json_to_sheet(
    data.goals.map((g) => ({
      'Goal Name': g.name,
      'Target Amount': `$${g.targetAmount.toFixed(2)}`,
      'Current Amount': `$${g.currentAmount.toFixed(2)}`,
      'Progress': `${g.progress.toFixed(1)}%`,
      'Target Date': new Date(g.targetDate).toLocaleDateString(),
    }))
  );
  goalsSheet['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
  ];

  // Report sheet
  const reportSheet = XLSX.utils.json_to_sheet(
    data.report.map((r) => ({
      Month: r.month,
      Income: `$${r.income.toFixed(2)}`,
      Expenses: `$${r.expenses.toFixed(2)}`,
      'Net Cash Flow': `$${r.netCashFlow.toFixed(2)}`,
      'Savings Rate': `${r.savingsRate.toFixed(1)}%`,
    }))
  );
  reportSheet['!cols'] = [
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  // Format all header rows
  [transactionsSheet, budgetSheet, goalsSheet, reportSheet].forEach((sheet) => {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (sheet[cellAddress]) {
        sheet[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4B5563' } },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }
    }
  });

  XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
  XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget');
  XLSX.utils.book_append_sheet(workbook, goalsSheet, 'Goals');
  XLSX.utils.book_append_sheet(workbook, reportSheet, 'Reports');

  XLSX.writeFile(workbook, fileName);
};
