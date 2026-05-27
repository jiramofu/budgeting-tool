import * as plaid from "plaid";
import { pool } from "../config/database";

interface PlaidAccount {
  id: string;
  mask: string;
  name: string;
  type: string;
  subtype: string;
  balance: number;
}

class PlaidService {
  private static client: any;

  static initialize(): void {
    this.client = new plaid.PlaidApi(
      new plaid.Configuration({
        basePath: plaid.PlaidEnvironments[(process.env.PLAID_ENV || "development") as keyof typeof plaid.PlaidEnvironments],
        baseOptions: {
          headers: {
            "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
            "PLAID-SECRET": process.env.PLAID_SECRET || "",
          },
        },
      })
    );
  }

  static async createLinkToken(userId: number): Promise<string> {
    try {
      const response = await this.client.linkTokenCreate({
        user: { client_user_id: userId.toString() },
        client_name: "Budgeting Tool",
        products: ["auth", "transactions"],
        country_codes: ["US"],
        language: "en",
      });

      return response.data.link_token;
    } catch (error) {
      console.error("Error creating Plaid link token:", error);
      throw new Error("Failed to create Plaid link token");
    }
  }

  static async exchangePublicToken(
    userId: number,
    publicToken: string,
    metadata: any
  ): Promise<{ itemId: string; accessToken: string }> {
    try {
      const response = await this.client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const { access_token, item_id } = response.data;

      await pool.query(
        `INSERT INTO bank_connections (user_id, plaid_item_id, institution_name, account_mask, access_token)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          item_id,
          metadata.institution?.name || "Unknown",
          metadata.accounts[0]?.mask || "****",
          access_token,
        ]
      );

      return { itemId: item_id, accessToken: access_token };
    } catch (error) {
      console.error("Error exchanging public token:", error);
      throw new Error("Failed to exchange public token");
    }
  }

  static async getAccounts(userId: number): Promise<PlaidAccount[]> {
    try {
      const result = await pool.query(
        "SELECT access_token, plaid_item_id FROM bank_connections WHERE user_id = $1",
        [userId]
      );

      const connections = result.rows;
      const accounts: PlaidAccount[] = [];

      for (const connection of connections) {
        const response = await this.client.accountsGet({
          access_token: connection.access_token,
        });

        response.data.accounts.forEach((account: any) => {
          accounts.push({
            id: account.account_id,
            mask: account.mask || "****",
            name: account.name,
            type: account.type,
            subtype: account.subtype,
            balance: account.balances.current || 0,
          });
        });
      }

      return accounts;
    } catch (error) {
      console.error("Error fetching Plaid accounts:", error);
      throw new Error("Failed to fetch accounts");
    }
  }

  static async syncTransactions(
    userId: number,
    days: number = 30
  ): Promise<{ imported: number; duplicates: number }> {
    try {
      const result = await pool.query(
        "SELECT access_token FROM bank_connections WHERE user_id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error("No bank connection found");
      }

      const accessToken = result.rows[0].access_token;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.client.transactionsGet({
        access_token: accessToken,
        start_date: startDate.toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
        options: { count: 100 },
      });

      let imported = 0;
      let duplicates = 0;

      for (const transaction of response.data.transactions) {
        const isDuplicate = await this.checkDuplicate(
          userId,
          transaction.amount,
          new Date(transaction.date)
        );

        if (isDuplicate) {
          duplicates++;
          continue;
        }

        const categoryId = this.suggestCategory(
          transaction.merchant_name || transaction.name
        );

        await pool.query(
          `INSERT INTO transactions (user_id, date, amount, description, category_id, source, imported_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
            transaction.date,
            transaction.amount,
            transaction.merchant_name || transaction.name,
            categoryId,
            "plaid",
            transaction.transaction_id,
          ]
        );

        imported++;
      }

      return { imported, duplicates };
    } catch (error) {
      console.error("Error syncing Plaid transactions:", error);
      throw new Error("Failed to sync transactions");
    }
  }

  private static async checkDuplicate(
    userId: number,
    amount: number,
    date: Date
  ): Promise<boolean> {
    const result = await pool.query(
      `SELECT id FROM transactions
       WHERE user_id = $1 AND amount = $2 AND date = $3 AND source = $4 LIMIT 1`,
      [userId, amount, date.toISOString().split("T")[0], "plaid"]
    );

    return result.rows.length > 0;
  }

  private static suggestCategory(description: string): number {
    const keywords: Record<string, number> = {
      grocery: 2,
      restaurant: 3,
      cafe: 3,
      gas: 4,
      fuel: 4,
      utility: 5,
      electric: 5,
      water: 5,
      entertainment: 6,
      movie: 6,
      health: 7,
      pharmacy: 7,
      doctor: 7,
      insurance: 8,
      amazon: 9,
      shop: 9,
      store: 9,
    };

    const lowerDesc = description.toLowerCase();
    for (const [keyword, categoryId] of Object.entries(keywords)) {
      if (lowerDesc.includes(keyword)) {
        return categoryId;
      }
    }

    return 1;
  }

  static async disconnectAccount(userId: number, itemId: string): Promise<void> {
    try {
      const result = await pool.query(
        "SELECT access_token FROM bank_connections WHERE user_id = $1 AND plaid_item_id = $2",
        [userId, itemId]
      );

      if (result.rows.length === 0) {
        throw new Error("Bank connection not found");
      }

      const accessToken = result.rows[0].access_token;

      try {
        await this.client.itemRemove({
          access_token: accessToken,
        });
      } catch (err) {
        console.warn("Error removing item from Plaid (may already be removed):", err);
      }

      await pool.query(
        "DELETE FROM bank_connections WHERE user_id = $1 AND plaid_item_id = $2",
        [userId, itemId]
      );
    } catch (error) {
      console.error("Error disconnecting account:", error);
      throw new Error("Failed to disconnect account");
    }
  }
}

export default PlaidService;
