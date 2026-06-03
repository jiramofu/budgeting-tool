-- Enable cascade delete for category_id in transactions table
-- This allows categories to be deleted along with all associated transactions

ALTER TABLE transactions
DROP CONSTRAINT transactions_category_id_fkey;

ALTER TABLE transactions
ADD CONSTRAINT transactions_category_id_fkey
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
