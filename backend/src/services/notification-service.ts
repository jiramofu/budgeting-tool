import nodemailer from "nodemailer";
import { pool } from "../config/database";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface NotificationPayload {
  type: string;
  userId: number;
  title: string;
  message: string;
  data?: Record<string, any>;
}

class NotificationService {
  private static transporter: any;

  static initialize(): void {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        ...options,
      });
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  static async sendBudgetAlert(
    userId: number,
    categoryName: string,
    percentage: number,
    spent: number,
    limit: number
  ): Promise<void> {
    try {
      const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);

      if (userResult.rows.length === 0) return;

      const email = userResult.rows[0].email;
      const status = percentage > 100 ? "exceeded" : "approaching";

      const html = `
        <h2>Budget Alert: ${categoryName}</h2>
        <p>You are ${status} your budget for <strong>${categoryName}</strong>.</p>
        <p>Spent: <strong>$${spent.toFixed(2)}</strong> of $${limit.toFixed(2)} (${percentage.toFixed(0)}%)</p>
        <p><a href="${process.env.FRONTEND_URL}/budgets">View Budgets</a></p>
      `;

      await this.sendEmail({
        to: email,
        subject: `Budget Alert: ${categoryName}`,
        html,
        text: `Budget Alert: ${categoryName}\n\nSpent: $${spent.toFixed(2)} of $${limit.toFixed(2)} (${percentage.toFixed(0)}%)`,
      });

      await this.createNotification({
        type: "budget_alert",
        userId,
        title: `${categoryName} Budget ${status}`,
        message: `You have spent $${spent.toFixed(2)} of $${limit.toFixed(2)}`,
        data: { categoryName, percentage, spent, limit },
      });
    } catch (error) {
      console.error("Error sending budget alert:", error);
    }
  }

  static async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    try {
      const html = `
        <h2>Welcome to Budgeting Tool, ${firstName}!</h2>
        <p>We're excited to have you on board. Here's what you can do next:</p>
        <ul>
          <li>Create your first budget</li>
          <li>Add your income and expenses</li>
          <li>Connect your bank account for automatic transaction sync</li>
          <li>Set up budget alerts</li>
        </ul>
        <p><a href="${process.env.FRONTEND_URL}">Get Started</a></p>
      `;

      await this.sendEmail({
        to: email,
        subject: "Welcome to Budgeting Tool",
        html,
        text: "Welcome to Budgeting Tool!",
      });
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  }

  static async sendTransactionNotification(
    userId: number,
    description: string,
    amount: number
  ): Promise<void> {
    try {
      await this.createNotification({
        type: "transaction",
        userId,
        title: "Transaction Added",
        message: `${description}: -$${amount.toFixed(2)}`,
        data: { description, amount },
      });
    } catch (error) {
      console.error("Error sending transaction notification:", error);
    }
  }

  static async sendMonthlyReport(userId: number): Promise<void> {
    try {
      const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);

      if (userResult.rows.length === 0) return;

      const email = userResult.rows[0].email;

      const budgetResult = await pool.query(
        `SELECT SUM(spent) as total_spent, SUM(target_amount) as total_budget
         FROM (
           SELECT SUM(ABS(amount)) as spent, target_amount
           FROM transactions t
           LEFT JOIN budget_targets bt ON t.category_id = bt.category_id
           WHERE t.user_id = $1 AND EXTRACT(MONTH FROM t.date) = EXTRACT(MONTH FROM CURRENT_DATE)
           AND EXTRACT(YEAR FROM t.date) = EXTRACT(YEAR FROM CURRENT_DATE)
           GROUP BY bt.target_amount
         ) subquery`,
        [userId]
      );

      const totalSpent = budgetResult.rows[0]?.total_spent || 0;
      const totalBudget = budgetResult.rows[0]?.total_budget || 0;

      const html = `
        <h2>Your Monthly Budget Summary</h2>
        <p>Here's how you're doing this month:</p>
        <p>Total Spent: <strong>$${totalSpent.toFixed(2)}</strong></p>
        <p>Total Budget: <strong>$${totalBudget.toFixed(2)}</strong></p>
        <p>Remaining: <strong>$${(totalBudget - totalSpent).toFixed(2)}</strong></p>
        <p><a href="${process.env.FRONTEND_URL}/analytics">View Detailed Analytics</a></p>
      `;

      await this.sendEmail({
        to: email,
        subject: "Your Monthly Budget Summary",
        html,
        text: `Monthly Summary\n\nSpent: $${totalSpent.toFixed(2)}\nBudget: $${totalBudget.toFixed(2)}\nRemaining: $${(totalBudget - totalSpent).toFixed(2)}`,
      });
    } catch (error) {
      console.error("Error sending monthly report:", error);
    }
  }

  private static async createNotification(payload: NotificationPayload): Promise<void> {
    try {
      const settingsResult = await pool.query("SELECT * FROM user_settings WHERE user_id = $1", [
        payload.userId,
      ]);

      if (settingsResult.rows.length === 0) return;

      const settings = settingsResult.rows[0];

      if (settings.push_notifications) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, data, read)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [payload.userId, payload.type, payload.title, payload.message, JSON.stringify(payload.data || {}), false]
        );
      }
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }

  static async getNotifications(userId: number, limit: number = 20): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  static async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      await pool.query("UPDATE notifications SET read = true WHERE id = $1", [notificationId]);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  static async scheduleMonthlyReports(): Promise<void> {
    try {
      const users = await pool.query("SELECT id FROM users");

      for (const user of users.rows) {
        await this.sendMonthlyReport(user.id);
      }
    } catch (error) {
      console.error("Error scheduling monthly reports:", error);
    }
  }
}

export default NotificationService;
