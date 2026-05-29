import { query } from '../config/database';

interface Subscription {
  id?: number;
  userId: number;
  name: string;
  amount: number;
  billingCycle: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextBillingDate: string;
  categoryId?: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  notes?: string;
}

interface SubscriptionSummary {
  monthlyCommitment: number;
  yearlyCommitment: number;
  activeCount: number;
  cancellationOpportunities: { name: string; amount: number; priority: string }[];
  subscriptions: Subscription[];
}

export class SubscriptionService {
  static async getSubscriptionSummary(userId: number, organizationId?: number): Promise<SubscriptionSummary> {
    try {
      const result = await query(
        `SELECT id, user_id, name, amount, billing_cycle, next_billing_date, category_id, is_active, start_date, end_date, notes
         FROM subscriptions
         WHERE user_id = $1 AND is_active = true ${organizationId ? 'AND organization_id = $2' : ''}
         ORDER BY next_billing_date ASC`,
        organizationId ? [userId, organizationId] : [userId]
      );

      let monthlyCommitment = 0;
      let yearlyCommitment = 0;
      const subscriptions: Subscription[] = [];
      const cancellationOpportunities: any[] = [];

      result.rows.forEach((row: any) => {
        const amount = Number(row.amount);
        const subscription: Subscription = {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          amount,
          billingCycle: row.billing_cycle,
          nextBillingDate: row.next_billing_date,
          categoryId: row.category_id,
          isActive: row.is_active,
          startDate: row.start_date,
          endDate: row.end_date,
          notes: row.notes,
        };

        subscriptions.push(subscription);

        // Calculate monthly commitment
        switch (row.billing_cycle) {
          case 'daily':
            monthlyCommitment += amount * 30;
            yearlyCommitment += amount * 365;
            break;
          case 'weekly':
            monthlyCommitment += (amount * 52) / 12;
            yearlyCommitment += amount * 52;
            break;
          case 'monthly':
            monthlyCommitment += amount;
            yearlyCommitment += amount * 12;
            break;
          case 'quarterly':
            monthlyCommitment += amount / 3;
            yearlyCommitment += amount * 4;
            break;
          case 'yearly':
            monthlyCommitment += amount / 12;
            yearlyCommitment += amount;
            break;
        }

        // Identify cancellation opportunities (low-usage, forgotten subscriptions)
        if (amount < 15) {
          cancellationOpportunities.push({
            name: row.name,
            amount,
            priority: 'high',
          });
        }
      });

      cancellationOpportunities.sort((a, b) => b.amount - a.amount);

      return {
        monthlyCommitment: Math.round(monthlyCommitment * 100) / 100,
        yearlyCommitment: Math.round(yearlyCommitment * 100) / 100,
        activeCount: subscriptions.length,
        cancellationOpportunities: cancellationOpportunities.slice(0, 5),
        subscriptions,
      };
    } catch (error) {
      console.error('[Subscription] Error getting subscription summary:', error);
      throw error;
    }
  }

  static async addSubscription(userId: number, subscription: Subscription, organizationId?: number): Promise<Subscription> {
    try {
      const result = await query(
        `INSERT INTO subscriptions (user_id, organization_id, name, amount, billing_cycle, next_billing_date, category_id, is_active, start_date, end_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, user_id, name, amount, billing_cycle, next_billing_date, category_id, is_active, start_date, end_date, notes`,
        [
          userId,
          organizationId || null,
          subscription.name,
          subscription.amount,
          subscription.billingCycle,
          subscription.nextBillingDate,
          subscription.categoryId,
          subscription.isActive,
          subscription.startDate,
          subscription.endDate,
          subscription.notes,
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        amount: Number(row.amount),
        billingCycle: row.billing_cycle,
        nextBillingDate: row.next_billing_date,
        categoryId: row.category_id,
        isActive: row.is_active,
        startDate: row.start_date,
        endDate: row.end_date,
        notes: row.notes,
      };
    } catch (error) {
      console.error('[Subscription] Error adding subscription:', error);
      throw error;
    }
  }

  static async cancelSubscription(subscriptionId: number, userId: number, organizationId?: number): Promise<void> {
    try {
      const now = new Date().toISOString().split('T')[0];
      await query(
        `UPDATE subscriptions
         SET is_active = false, end_date = $1
         WHERE id = $2 AND user_id = $3 ${organizationId ? 'AND organization_id = $4' : ''}`,
        organizationId ? [now, subscriptionId, userId, organizationId] : [now, subscriptionId, userId]
      );
    } catch (error) {
      console.error('[Subscription] Error canceling subscription:', error);
      throw error;
    }
  }

  static async getUpcomingBillings(userId: number, days: number = 30, organizationId?: number): Promise<Subscription[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const result = await query(
        `SELECT id, user_id, name, amount, billing_cycle, next_billing_date, category_id, is_active, start_date, end_date, notes
         FROM subscriptions
         WHERE user_id = $1 AND is_active = true AND next_billing_date <= $2 ${organizationId ? 'AND organization_id = $3' : ''}
         ORDER BY next_billing_date ASC`,
        organizationId ? [userId, futureDate.toISOString().split('T')[0], organizationId] : [userId, futureDate.toISOString().split('T')[0]]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        amount: Number(row.amount),
        billingCycle: row.billing_cycle,
        nextBillingDate: row.next_billing_date,
        categoryId: row.category_id,
        isActive: row.is_active,
        startDate: row.start_date,
        endDate: row.end_date,
        notes: row.notes,
      }));
    } catch (error) {
      console.error('[Subscription] Error getting upcoming billings:', error);
      throw error;
    }
  }
}
