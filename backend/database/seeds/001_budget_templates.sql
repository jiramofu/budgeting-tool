-- Seed budget templates for Phase 3: Search & Discovery
-- Insert standard budget templates

INSERT INTO budget_templates (name, description, template_type, category_structure, target_percentages, is_default, is_active)
VALUES
  (
    'Minimalist Budget',
    'Essential spending only - ideal for frugal living or rebuilding',
    'minimalist',
    '{"Housing": {"type": "fixed", "target": 1000}, "Food": {"type": "variable", "target": 200}, "Transportation": {"type": "fixed", "target": 150}, "Utilities": {"type": "fixed", "target": 100}, "Healthcare": {"type": "variable", "target": 100}, "Other": {"type": "variable", "target": 100}}'::jsonb,
    '{"Housing": 50, "Food": 15, "Transportation": 10, "Utilities": 8, "Healthcare": 10, "Other": 7}'::jsonb,
    true,
    true
  ),
  (
    'Comfortable Budget',
    'Balanced spending with lifestyle choices - standard middle-income',
    'comfortable',
    '{"Housing": {"type": "fixed", "target": 1500}, "Food": {"type": "variable", "target": 400}, "Transportation": {"type": "fixed", "target": 300}, "Utilities": {"type": "fixed", "target": 150}, "Entertainment": {"type": "variable", "target": 200}, "Healthcare": {"type": "variable", "target": 150}, "Insurance": {"type": "fixed", "target": 200}, "Dining Out": {"type": "variable", "target": 150}, "Shopping": {"type": "variable", "target": 150}, "Savings": {"type": "variable", "target": 300}}'::jsonb,
    '{"Housing": 35, "Food": 12, "Transportation": 8, "Utilities": 4, "Entertainment": 6, "Healthcare": 4, "Insurance": 5, "Dining Out": 4, "Shopping": 4, "Savings": 8}'::jsonb,
    false,
    true
  ),
  (
    'Luxury Budget',
    'High-end lifestyle spending - upper income',
    'luxury',
    '{"Housing": {"type": "fixed", "target": 3000}, "Food": {"type": "variable", "target": 600}, "Transportation": {"type": "fixed", "target": 800}, "Utilities": {"type": "fixed", "target": 250}, "Entertainment": {"type": "variable", "target": 500}, "Healthcare": {"type": "variable", "target": 300}, "Insurance": {"type": "fixed", "target": 400}, "Dining Out": {"type": "variable", "target": 500}, "Travel": {"type": "variable", "target": 1000}, "Shopping": {"type": "variable", "target": 400}, "Savings": {"type": "variable", "target": 1000}}'::jsonb,
    '{"Housing": 25, "Food": 8, "Transportation": 8, "Utilities": 3, "Entertainment": 6, "Healthcare": 4, "Insurance": 5, "Dining Out": 6, "Travel": 12, "Shopping": 5, "Savings": 12}'::jsonb,
    false,
    true
  ),
  (
    'Family Budget',
    'Multi-person household spending - optimized for families',
    'family',
    '{"Housing": {"type": "fixed", "target": 2000}, "Food": {"type": "variable", "target": 600}, "Transportation": {"type": "fixed", "target": 500}, "Utilities": {"type": "fixed", "target": 200}, "Childcare": {"type": "fixed", "target": 500}, "Education": {"type": "fixed", "target": 200}, "Healthcare": {"type": "variable", "target": 300}, "Insurance": {"type": "fixed", "target": 400}, "Entertainment": {"type": "variable", "target": 200}, "Dining Out": {"type": "variable", "target": 200}, "Savings": {"type": "variable", "target": 400}}'::jsonb,
    '{"Housing": 30, "Food": 12, "Transportation": 10, "Utilities": 4, "Childcare": 10, "Education": 4, "Healthcare": 6, "Insurance": 8, "Entertainment": 4, "Dining Out": 4, "Savings": 8}'::jsonb,
    false,
    true
  ),
  (
    'Student Budget',
    'Limited income budget - ideal for students and entry-level earners',
    'student',
    '{"Housing": {"type": "fixed", "target": 400}, "Food": {"type": "variable", "target": 150}, "Transportation": {"type": "variable", "target": 50}, "Phone": {"type": "fixed", "target": 40}, "Internet": {"type": "fixed", "target": 30}, "Entertainment": {"type": "variable", "target": 50}, "Books": {"type": "variable", "target": 50}, "Healthcare": {"type": "variable", "target": 30}, "Emergency Fund": {"type": "variable", "target": 100}}'::jsonb,
    '{"Housing": 40, "Food": 18, "Transportation": 6, "Phone": 5, "Internet": 4, "Entertainment": 8, "Books": 6, "Healthcare": 4, "Emergency Fund": 9}'::jsonb,
    false,
    true
  ),
  (
    'Retirement Budget',
    'Fixed income budget - optimized for retirees',
    'retirement',
    '{"Housing": {"type": "fixed", "target": 1000}, "Food": {"type": "variable", "target": 300}, "Transportation": {"type": "variable", "target": 100}, "Utilities": {"type": "fixed", "target": 120}, "Healthcare": {"type": "fixed", "target": 300}, "Insurance": {"type": "fixed", "target": 150}, "Entertainment": {"type": "variable", "target": 200}, "Dining Out": {"type": "variable", "target": 150}, "Travel": {"type": "variable", "target": 200}, "Gifts": {"type": "variable", "target": 100}}'::jsonb,
    '{"Housing": 35, "Food": 12, "Transportation": 4, "Utilities": 5, "Healthcare": 12, "Insurance": 6, "Entertainment": 8, "Dining Out": 6, "Travel": 8, "Gifts": 4}'::jsonb,
    false,
    true
  );

-- Log insertion
DO $$
BEGIN
  RAISE NOTICE 'Budget templates seeded successfully';
END $$;
