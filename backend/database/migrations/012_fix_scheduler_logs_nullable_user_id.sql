-- Fix scheduler_logs foreign key constraint
-- Make user_id nullable so system jobs can log without requiring a user

ALTER TABLE scheduler_logs
DROP CONSTRAINT scheduler_logs_user_id_fkey;

ALTER TABLE scheduler_logs
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE scheduler_logs
ADD CONSTRAINT scheduler_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
