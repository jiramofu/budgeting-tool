-- Insert default categories for the first user (ID 1)
-- Run: psql -U postgres -d budgeting_tool -f database/seed_categories.sql

INSERT INTO categories (user_id, name, type, color, icon) VALUES
-- Fixed Expenses
(1, 'Rent/Mortgage', 'fixed', '#3b82f6', '🏠'),
(1, 'Insurance', 'fixed', '#3b82f6', '🛡️'),
(1, 'Utilities', 'fixed', '#3b82f6', '💡'),
(1, 'Phone/Internet', 'fixed', '#3b82f6', '📱'),

-- Variable Expenses
(1, 'Groceries', 'variable', '#ef4444', '🛒'),
(1, 'Dining Out', 'variable', '#ef4444', '🍽️'),
(1, 'Transportation', 'variable', '#ef4444', '🚗'),
(1, 'Gas', 'variable', '#ef4444', '⛽'),
(1, 'Entertainment', 'variable', '#ef4444', '🎬'),
(1, 'Shopping', 'variable', '#ef4444', '🛍️'),
(1, 'Health & Wellness', 'variable', '#ef4444', '💪'),
(1, 'Personal Care', 'variable', '#ef4444', '💇'),

-- Recurring Expenses
(1, 'Subscriptions', 'recurring', '#10b981', '📺'),
(1, 'Gym Membership', 'recurring', '#10b981', '🏋️'),
(1, 'Software/Apps', 'recurring', '#10b981', '💻'),
(1, 'Donations', 'recurring', '#10b981', '❤️')
ON CONFLICT DO NOTHING;

SELECT COUNT(*) as total_categories FROM categories WHERE user_id = 1;
