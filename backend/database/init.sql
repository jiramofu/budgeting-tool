-- Initialize the budgeting_tool database
-- Run: psql -U postgres -f init.sql

CREATE DATABASE budgeting_tool;
\c budgeting_tool

-- Run the main schema
-- Note: Execute schema.sql separately with:
-- psql -U postgres -d budgeting_tool -f database/schema.sql
