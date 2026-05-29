import { pool } from '../config/database';

interface SearchFilter {
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  categories?: number[];
  description?: string;
  merchants?: string[];
  tags?: string[];
}

interface SavedSearch {
  id: number;
  name: string;
  description?: string;
  filters: SearchFilter;
  searchCount: number;
  lastUsedAt?: string;
  isFavorite: boolean;
}

interface SearchResult {
  id: number;
  date: string;
  amount: number;
  description: string;
  category: string;
  categoryId: number;
}

export class SearchService {
  /**
   * Advanced transaction search with filtering
   */
  async searchTransactions(
    userId: number,
    filters: SearchFilter,
    limit: number = 50,
    offset: number = 0,
    organizationId: number
  ): Promise<{ results: SearchResult[]; total: number }> {
    try {
      let query = `
        SELECT
          t.id,
          t.date,
          t.amount,
          t.description,
          c.name as category,
          c.id as categoryId
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1 ${organizationId ? 'AND t.organization_id = $2' : ''}
      `;

      const params: any[] = [userId];
      let paramIndex = organizationId ? 3 : 2;
      if (organizationId) params.push(organizationId);

      // Amount range filter
      if (filters.minAmount !== undefined) {
        query += ` AND t.amount >= $${paramIndex}`;
        params.push(filters.minAmount);
        paramIndex++;
      }

      if (filters.maxAmount !== undefined) {
        query += ` AND t.amount <= $${paramIndex}`;
        params.push(filters.maxAmount);
        paramIndex++;
      }

      // Date range filter
      if (filters.startDate) {
        query += ` AND t.date >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        query += ` AND t.date <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        const placeholders = filters.categories.map(() => `$${paramIndex++}`).join(',');
        query += ` AND t.category_id IN (${placeholders})`;
        params.push(...filters.categories);
      }

      // Description search (case-insensitive)
      if (filters.description) {
        query += ` AND LOWER(t.description) LIKE LOWER($${paramIndex})`;
        params.push(`%${filters.description}%`);
        paramIndex++;
      }

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM (${query}) as filtered`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // Add sorting and pagination
      query += ` ORDER BY t.date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Record search analytics
      await this.recordSearchAnalytics(userId, filters, result.rows.length, organizationId);

      return {
        results: result.rows,
        total,
      };
    } catch (error: any) {
      console.error('Error searching transactions:', error);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions for search
   */
  async getSearchSuggestions(
    userId: number,
    searchTerm: string,
    limit: number = 10,
    organizationId: number
  ): Promise<string[]> {
    try {
      const result = await pool.query(
        `
        SELECT DISTINCT LOWER(description) as suggestion
        FROM transactions
        WHERE user_id = $1 AND LOWER(description) LIKE LOWER($2) ${organizationId ? 'AND organization_id = $4' : ''}
        ORDER BY (
          SELECT COUNT(*) FROM transactions t2
          WHERE t2.user_id = $1 AND LOWER(t2.description) = LOWER(transactions.description) ${organizationId ? 'AND t2.organization_id = $4' : ''}
        ) DESC
        LIMIT $3
        `,
        organizationId ? [userId, `${searchTerm}%`, limit, organizationId] : [userId, `${searchTerm}%`, limit]
      );

      return result.rows.map(r => r.suggestion);
    } catch (error: any) {
      console.error('Error getting search suggestions:', error);
      throw error;
    }
  }

  /**
   * Save a search query for later use
   */
  async saveSearch(
    userId: number,
    name: string,
    filters: SearchFilter,
    organizationId: number,
    description?: string
  ): Promise<SavedSearch> {
    try {
      const result = await pool.query(
        `
        INSERT INTO search_queries (user_id, organization_id, name, description, filters_json)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, organization_id, name) DO UPDATE
        SET filters_json = $5, updated_at = CURRENT_TIMESTAMP
        RETURNING id, name, description, filters_json as filters, search_count as "searchCount",
                  last_used_at as "lastUsedAt", is_favorite as "isFavorite"
        `,
        [userId, organizationId || null, name, description || null, JSON.stringify(filters)]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  }

  /**
   * Get saved searches for a user
   */
  async getSavedSearches(userId: number, organizationId?: number): Promise<SavedSearch[]> {
    try {
      const result = await pool.query(
        `
        SELECT
          id, name, description, filters_json as filters, search_count as "searchCount",
          last_used_at as "lastUsedAt", is_favorite as "isFavorite"
        FROM search_queries
        WHERE user_id = $1 ${organizationId ? 'AND organization_id = $2' : ''}
        ORDER BY is_favorite DESC, last_used_at DESC NULLS LAST
        `,
        organizationId ? [userId, organizationId] : [userId]
      );

      return result.rows.map(row => ({
        ...row,
        filters: row.filters,
      }));
    } catch (error: any) {
      console.error('Error getting saved searches:', error);
      throw error;
    }
  }

  /**
   * Delete a saved search
   */
  async deleteSearch(userId: number, searchId: number, organizationId?: number): Promise<boolean> {
    try {
      const result = await pool.query(
        `DELETE FROM search_queries WHERE id = $1 AND user_id = $2 ${organizationId ? 'AND organization_id = $3' : ''}`,
        organizationId ? [searchId, userId, organizationId] : [searchId, userId]
      );

      return (result.rowCount ?? 0) > 0;
    } catch (error: any) {
      console.error('Error deleting search:', error);
      throw error;
    }
  }

  /**
   * Toggle search as favorite
   */
  async toggleSearchFavorite(userId: number, searchId: number, organizationId?: number): Promise<boolean> {
    try {
      const result = await pool.query(
        `
        UPDATE search_queries
        SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2 ${organizationId ? 'AND organization_id = $3' : ''}
        RETURNING is_favorite
        `,
        organizationId ? [searchId, userId, organizationId] : [searchId, userId]
      );

      return (result.rowCount ?? 0) > 0;
    } catch (error: any) {
      console.error('Error toggling search favorite:', error);
      throw error;
    }
  }

  /**
   * Record search analytics
   */
  private async recordSearchAnalytics(
    userId: number,
    filters: SearchFilter,
    resultsCount: number,
    organizationId: number
  ): Promise<void> {
    try {
      await pool.query(
        `
        INSERT INTO search_analytics (user_id, organization_id, search_term, filters_used, results_count)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [userId, organizationId || null, filters.description || null, JSON.stringify(filters), resultsCount]
      );
    } catch (error: any) {
      console.error('Error recording search analytics:', error);
      // Don't throw - analytics failure shouldn't break search
    }
  }

  /**
   * Get popular search terms across all users (anonymized)
   */
  async getPopularSearchTerms(limit: number = 10, organizationId?: number): Promise<
    { term: string; count: number }[]
  > {
    try {
      const result = await pool.query(
        `
        SELECT search_term as term, COUNT(*) as count
        FROM search_analytics
        WHERE search_term IS NOT NULL ${organizationId ? 'AND organization_id = $2' : ''}
        GROUP BY search_term
        ORDER BY count DESC
        LIMIT $1
        `,
        organizationId ? [limit, organizationId] : [limit]
      );

      return result.rows;
    } catch (error: any) {
      console.error('Error getting popular search terms:', error);
      throw error;
    }
  }
}

export const searchService = new SearchService();
