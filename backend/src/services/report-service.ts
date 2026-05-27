import PDFDocument from "pdfkit";
import { createReadStream, createWriteStream } from "fs";
import { join } from "path";
import { pool } from "../config/database";

interface TransactionReport {
  date: string;
  description: string;
  category: string;
  amount: number;
  balance: number;
}

interface CategorySummary {
  category: string;
  spent: number;
  budget: number;
  percentage: number;
}

class ReportService {
  static async generateMonthlyPDFReport(
    userId: number,
    month: number,
    year: number
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const buffers: Buffer[] = [];

        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);

        doc
          .fontSize(24)
          .text("Monthly Budget Report", { align: "center" })
          .fontSize(12)
          .text(`${this.getMonthName(month)} ${year}`, { align: "center" });

        doc.moveDown();

        const summaryResult = await pool.query(
          `SELECT 
            SUM(ABS(CASE WHEN amount < 0 THEN amount ELSE 0 END)) as total_spent,
            SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
            COUNT(*) as transaction_count
           FROM transactions 
           WHERE user_id = $1 
           AND EXTRACT(MONTH FROM date) = $2 
           AND EXTRACT(YEAR FROM date) = $3`,
          [userId, month, year]
        );

        const summary = summaryResult.rows[0];

        doc.fontSize(14).text("Summary", { underline: true });
        doc.fontSize(11);
        doc.text(`Total Income: $${(summary.total_income || 0).toFixed(2)}`);
        doc.text(`Total Spent: $${(summary.total_spent || 0).toFixed(2)}`);
        doc.text(`Net: $${((summary.total_income || 0) - (summary.total_spent || 0)).toFixed(2)}`);
        doc.text(`Transactions: ${summary.transaction_count}`);

        doc.moveDown();

        const categoryResult = await pool.query(
          `SELECT 
            c.name as category,
            SUM(ABS(t.amount)) as spent,
            bt.target_amount as budget
           FROM transactions t
           JOIN categories c ON t.category_id = c.id
           LEFT JOIN budget_targets bt ON bt.category_id = c.id
           WHERE t.user_id = $1 
           AND EXTRACT(MONTH FROM t.date) = $2 
           AND EXTRACT(YEAR FROM t.date) = $3
           AND t.amount < 0
           GROUP BY c.id, c.name, bt.target_amount
           ORDER BY spent DESC`,
          [userId, month, year]
        );

        doc.fontSize(14).text("Spending by Category", { underline: true });
        doc.fontSize(10);

        doc.text("Category\t\tSpent\t\tBudget\t\t% of Budget");
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        for (const row of categoryResult.rows) {
          const percentage = row.budget ? ((row.spent / row.budget) * 100).toFixed(0) : "N/A";
          doc.text(
            `${row.category}\t\t$${row.spent.toFixed(2)}\t\t$${(row.budget || 0).toFixed(2)}\t\t${percentage}%`
          );
        }

        doc.moveDown();

        const transactionResult = await pool.query(
          `SELECT 
            t.date,
            t.description,
            c.name as category,
            t.amount
           FROM transactions t
           JOIN categories c ON t.category_id = c.id
           WHERE t.user_id = $1 
           AND EXTRACT(MONTH FROM t.date) = $2 
           AND EXTRACT(YEAR FROM t.date) = $3
           ORDER BY t.date DESC
           LIMIT 30`,
          [userId, month, year]
        );

        doc.fontSize(14).text("Recent Transactions", { underline: true });
        doc.fontSize(9);
        doc.text("Date\t\t\tDescription\t\tCategory\t\tAmount");
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        for (const row of transactionResult.rows) {
          doc.text(
            `${new Date(row.date).toLocaleDateString()}\t${row.description.substring(0, 15)}\t${row.category}\t\t$${row.amount.toFixed(2)}`
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static async generateMonthlyCSVReport(
    userId: number,
    month: number,
    year: number
  ): Promise<string> {
    try {
      const result = await pool.query(
        `SELECT 
          t.date,
          t.description,
          c.name as category,
          t.amount,
          t.source
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 
         AND EXTRACT(MONTH FROM t.date) = $2 
         AND EXTRACT(YEAR FROM t.date) = $3
         ORDER BY t.date DESC`,
        [userId, month, year]
      );

      let csv = "Date,Description,Category,Amount,Source\n";

      for (const row of result.rows) {
        csv += `${row.date},"${row.description}",${row.category},${row.amount},${row.source}\n`;
      }

      return csv;
    } catch (error) {
      console.error("Error generating CSV report:", error);
      throw error;
    }
  }

  static async generateAnnualCSVReport(userId: number, year: number): Promise<string> {
    try {
      const result = await pool.query(
        `SELECT 
          EXTRACT(MONTH FROM t.date) as month,
          c.name as category,
          SUM(ABS(t.amount)) as spent,
          COUNT(*) as transaction_count
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 
         AND EXTRACT(YEAR FROM t.date) = $2
         AND t.amount < 0
         GROUP BY EXTRACT(MONTH FROM t.date), c.name
         ORDER BY month, category`,
        [userId, year]
      );

      let csv = "Month,Category,Total Spent,Transaction Count\n";

      for (const row of result.rows) {
        csv += `${this.getMonthName(row.month)},${row.category},${row.spent.toFixed(2)},${row.transaction_count}\n`;
      }

      return csv;
    } catch (error) {
      console.error("Error generating annual CSV report:", error);
      throw error;
    }
  }

  static async generateSpendingTrendCSV(userId: number, months: number = 12): Promise<string> {
    try {
      const result = await pool.query(
        `SELECT 
          DATE_TRUNC('month', t.date) as month,
          SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as spent,
          SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income,
          COUNT(*) as transaction_count
         FROM transactions t
         WHERE t.user_id = $1 
         AND t.date >= CURRENT_DATE - INTERVAL '${months} months'
         GROUP BY DATE_TRUNC('month', t.date)
         ORDER BY month DESC`,
        [userId]
      );

      let csv = "Month,Total Spent,Total Income,Net,Transaction Count\n";

      for (const row of result.rows) {
        const month = new Date(row.month).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
        const net = row.income - row.spent;
        csv += `${month},${row.spent.toFixed(2)},${row.income.toFixed(2)},${net.toFixed(2)},${row.transaction_count}\n`;
      }

      return csv;
    } catch (error) {
      console.error("Error generating spending trend CSV:", error);
      throw error;
    }
  }

  private static getMonthName(month: number): string {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[month - 1] || "Unknown";
  }
}

export default ReportService;
