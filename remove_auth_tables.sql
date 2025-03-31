-- Drop auth-related tables
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS organization_users;

-- Disable RLS on all tables
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_scenarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_income DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE actual_income DISABLE ROW LEVEL SECURITY;
ALTER TABLE actual_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_kpis DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can view their organization's products" ON products;
DROP POLICY IF EXISTS "Users can insert their organization's products" ON products;
DROP POLICY IF EXISTS "Users can update their organization's products" ON products;
DROP POLICY IF EXISTS "Users can delete their organization's products" ON products;

DROP POLICY IF EXISTS "Users can view entries from their organization" ON actual_entries;
DROP POLICY IF EXISTS "Users can insert entries to their organization" ON actual_entries;
DROP POLICY IF EXISTS "Users can update entries from their organization" ON actual_entries;
DROP POLICY IF EXISTS "Users can delete entries from their organization" ON actual_entries;

-- Grant access to all tables for anonymous users
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON forecasts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_scenarios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_income TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_expenses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON actual_income TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON actual_expenses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_kpis TO anon; 