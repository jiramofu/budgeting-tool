import { pool } from '../db';

interface BudgetTemplate {
  id: number;
  name: string;
  description?: string;
  templateType: string;
  categoryStructure: any;
  targetPercentages: any;
  isDefault: boolean;
}

interface TemplateApplication {
  id: number;
  templateId: number;
  budgetId?: number;
  appliedAt: string;
  customizations?: any;
}

export class TemplateService {
  /**
   * Get all available templates
   */
  async getAllTemplates(): Promise<BudgetTemplate[]> {
    try {
      const result = await pool.query(
        `
        SELECT
          id,
          name,
          description,
          template_type as "templateType",
          category_structure as "categoryStructure",
          target_percentages as "targetPercentages",
          is_default as "isDefault"
        FROM budget_templates
        WHERE is_active = TRUE
        ORDER BY is_default DESC, name ASC
        `
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Get templates by type
   */
  async getTemplatesByType(templateType: string): Promise<BudgetTemplate[]> {
    try {
      const validTypes = ['minimalist', 'comfortable', 'luxury', 'family', 'student', 'retirement', 'custom'];

      if (!validTypes.includes(templateType)) {
        throw new Error(`Invalid template type: ${templateType}`);
      }

      const result = await pool.query(
        `
        SELECT
          id,
          name,
          description,
          template_type as "templateType",
          category_structure as "categoryStructure",
          target_percentages as "targetPercentages",
          is_default as "isDefault"
        FROM budget_templates
        WHERE is_active = TRUE AND template_type = $1
        ORDER BY is_default DESC, name ASC
        `,
        [templateType]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting templates by type:', error);
      throw error;
    }
  }

  /**
   * Get a specific template
   */
  async getTemplate(templateId: number): Promise<BudgetTemplate | null> {
    try {
      const result = await pool.query(
        `
        SELECT
          id,
          name,
          description,
          template_type as "templateType",
          category_structure as "categoryStructure",
          target_percentages as "targetPercentages",
          is_default as "isDefault"
        FROM budget_templates
        WHERE id = $1 AND is_active = TRUE
        `,
        [templateId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting template:', error);
      throw error;
    }
  }

  /**
   * Apply a template to a budget
   */
  async applyTemplate(
    userId: number,
    templateId: number,
    budgetId: number,
    customizations?: any
  ): Promise<TemplateApplication> {
    try {
      // Verify user owns the budget
      const budgetCheck = await pool.query(
        `SELECT id FROM budgets WHERE id = $1 AND user_id = $2`,
        [budgetId, userId]
      );

      if (budgetCheck.rows.length === 0) {
        throw new Error('Budget not found or not owned by user');
      }

      // Verify template exists
      const templateCheck = await pool.query(
        `SELECT category_structure FROM budget_templates WHERE id = $1 AND is_active = TRUE`,
        [templateId]
      );

      if (templateCheck.rows.length === 0) {
        throw new Error('Template not found');
      }

      const template = templateCheck.rows[0];

      // Begin transaction to apply template
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Apply template categories and targets
        const categoryStructure = template.category_structure;

        for (const categoryName of Object.keys(categoryStructure)) {
          // Check if category exists
          let categoryId = await this.getOrCreateCategory(
            userId,
            categoryName,
            categoryStructure[categoryName]?.type || 'variable'
          );

          // Create budget target
          await client.query(
            `
            INSERT INTO budget_targets (budget_id, category_id, target_amount)
            VALUES ($1, $2, $3)
            ON CONFLICT (budget_id, category_id) DO UPDATE
            SET target_amount = $3
            `,
            [budgetId, categoryId, categoryStructure[categoryName]?.target || 0]
          );
        }

        // Record template application
        const result = await client.query(
          `
          INSERT INTO template_applications (user_id, template_id, budget_id, customizations_json)
          VALUES ($1, $2, $3, $4)
          RETURNING id, template_id as "templateId", budget_id as "budgetId",
                    applied_at as "appliedAt", customizations_json as "customizations"
          `,
          [userId, templateId, budgetId, JSON.stringify(customizations || {})]
        );

        await client.query('COMMIT');

        return result.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error applying template:', error);
      throw error;
    }
  }

  /**
   * Get applications of templates by user
   */
  async getUserTemplateApplications(userId: number): Promise<TemplateApplication[]> {
    try {
      const result = await pool.query(
        `
        SELECT
          id,
          template_id as "templateId",
          budget_id as "budgetId",
          applied_at as "appliedAt",
          customizations_json as "customizations"
        FROM template_applications
        WHERE user_id = $1
        ORDER BY applied_at DESC
        `,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting template applications:', error);
      throw error;
    }
  }

  /**
   * Create a new template (admin only)
   */
  async createTemplate(
    name: string,
    description: string,
    templateType: string,
    categoryStructure: any,
    targetPercentages: any,
    isDefault: boolean = false
  ): Promise<BudgetTemplate> {
    try {
      const validTypes = ['minimalist', 'comfortable', 'luxury', 'family', 'student', 'retirement', 'custom'];

      if (!validTypes.includes(templateType)) {
        throw new Error(`Invalid template type: ${templateType}`);
      }

      const result = await pool.query(
        `
        INSERT INTO budget_templates
        (name, description, template_type, category_structure, target_percentages, is_default)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          name,
          description,
          template_type as "templateType",
          category_structure as "categoryStructure",
          target_percentages as "targetPercentages",
          is_default as "isDefault"
        `,
        [name, description, templateType, JSON.stringify(categoryStructure), JSON.stringify(targetPercentages), isDefault]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Update a template (admin only)
   */
  async updateTemplate(
    templateId: number,
    updates: Partial<BudgetTemplate>
  ): Promise<BudgetTemplate> {
    try {
      const setClause: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name) {
        setClause.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }

      if (updates.description) {
        setClause.push(`description = $${paramIndex++}`);
        values.push(updates.description);
      }

      if (updates.categoryStructure) {
        setClause.push(`category_structure = $${paramIndex++}`);
        values.push(JSON.stringify(updates.categoryStructure));
      }

      if (updates.targetPercentages) {
        setClause.push(`target_percentages = $${paramIndex++}`);
        values.push(JSON.stringify(updates.targetPercentages));
      }

      if (updates.isDefault !== undefined) {
        setClause.push(`is_default = $${paramIndex++}`);
        values.push(updates.isDefault);
      }

      if (setClause.length === 0) {
        throw new Error('No updates provided');
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(templateId);

      const result = await pool.query(
        `
        UPDATE budget_templates
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING
          id,
          name,
          description,
          template_type as "templateType",
          category_structure as "categoryStructure",
          target_percentages as "targetPercentages",
          is_default as "isDefault"
        `,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Template not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Get or create a category for template application
   */
  private async getOrCreateCategory(
    userId: number,
    categoryName: string,
    categoryType: string
  ): Promise<number> {
    try {
      // Check if category exists
      const existingCheck = await pool.query(
        `SELECT id FROM categories WHERE user_id = $1 AND name = $2`,
        [userId, categoryName]
      );

      if (existingCheck.rows.length > 0) {
        return existingCheck.rows[0].id;
      }

      // Create new category
      const createResult = await pool.query(
        `
        INSERT INTO categories (user_id, name, type)
        VALUES ($1, $2, $3)
        RETURNING id
        `,
        [userId, categoryName, categoryType]
      );

      return createResult.rows[0].id;
    } catch (error) {
      console.error('Error getting or creating category:', error);
      throw error;
    }
  }
}

export const templateService = new TemplateService();
