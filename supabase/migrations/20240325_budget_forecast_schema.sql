-- Create necessary extensions if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Budget Income table
CREATE TABLE IF NOT EXISTS budget_income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  type TEXT NOT NULL CHECK (type IN ('consultancy', 'saas')),
  client TEXT,
  project TEXT,
  hours DECIMAL(8, 2),
  rate DECIMAL(12, 2),
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Budget Expenses table
CREATE TABLE IF NOT EXISTS budget_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  cost_category TEXT NOT NULL, -- Grootboek zoals Personeelskosten, Marketing, R&D, etc.
  sub_category TEXT, -- Sub-categorieën optioneel (bijvoorbeeld "Content Marketing" binnen Marketing)
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Actual Income table
CREATE TABLE IF NOT EXISTS actual_income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  type TEXT NOT NULL CHECK (type IN ('consultancy', 'saas')),
  client TEXT,
  project TEXT,
  hours DECIMAL(8, 2),
  rate DECIMAL(12, 2),
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Actual Expenses table
CREATE TABLE IF NOT EXISTS actual_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  cost_category TEXT NOT NULL, -- Grootboek zoals Personeelskosten, Marketing, R&D, etc.
  sub_category TEXT, -- Sub-categorieën optioneel (bijvoorbeeld "Content Marketing" binnen Marketing)
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Budget Summary KPIs table
CREATE TABLE IF NOT EXISTS budget_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  name TEXT NOT NULL, -- SaaS aandeel, Personeelskosten %, R&D %, Marketing budget, Netto resultaat, etc.
  target DECIMAL(12, 2) NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('percentage', 'amount', 'months')),
  comparison TEXT NOT NULL CHECK (comparison IN ('min', 'max', 'equals')),
  alert_threshold DECIMAL(12, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Budget Scenarios table
CREATE TABLE IF NOT EXISTS budget_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('optimistic', 'conservative', 'base')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false
);

-- Create Row Level Security policies
ALTER TABLE budget_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE actual_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE actual_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS policies for budget_income
CREATE POLICY "Users can view budget_income in their organization"
  ON budget_income FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert budget_income in their organization"
  ON budget_income FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update budget_income in their organization"
  ON budget_income FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete budget_income in their organization"
  ON budget_income FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS policies for budget_expenses
CREATE POLICY "Users can view budget_expenses in their organization"
  ON budget_expenses FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert budget_expenses in their organization"
  ON budget_expenses FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update budget_expenses in their organization"
  ON budget_expenses FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete budget_expenses in their organization"
  ON budget_expenses FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS policies for actual_income
CREATE POLICY "Users can view actual_income in their organization"
  ON actual_income FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert actual_income in their organization"
  ON actual_income FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update actual_income in their organization"
  ON actual_income FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete actual_income in their organization"
  ON actual_income FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS policies for actual_expenses
CREATE POLICY "Users can view actual_expenses in their organization"
  ON actual_expenses FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert actual_expenses in their organization"
  ON actual_expenses FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update actual_expenses in their organization"
  ON actual_expenses FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete actual_expenses in their organization"
  ON actual_expenses FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS policies for budget_kpis
CREATE POLICY "Users can view budget_kpis in their organization"
  ON budget_kpis FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert budget_kpis in their organization"
  ON budget_kpis FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update budget_kpis in their organization"
  ON budget_kpis FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete budget_kpis in their organization"
  ON budget_kpis FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS policies for budget_scenarios
CREATE POLICY "Users can view budget_scenarios in their organization"
  ON budget_scenarios FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert budget_scenarios in their organization"
  ON budget_scenarios FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update budget_scenarios in their organization"
  ON budget_scenarios FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete budget_scenarios in their organization"
  ON budget_scenarios FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Create triggers for updated_at timestamps
CREATE TRIGGER set_updated_at_budget_income
BEFORE UPDATE ON budget_income
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_budget_expenses
BEFORE UPDATE ON budget_expenses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_actual_income
BEFORE UPDATE ON actual_income
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_actual_expenses
BEFORE UPDATE ON actual_expenses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_budget_kpis
BEFORE UPDATE ON budget_kpis
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_budget_scenarios
BEFORE UPDATE ON budget_scenarios
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Add indexes for better performance
CREATE INDEX budget_income_organization_year_month_idx ON budget_income(organization_id, year, month);
CREATE INDEX budget_expenses_organization_year_month_idx ON budget_expenses(organization_id, year, month);
CREATE INDEX actual_income_organization_year_month_idx ON actual_income(organization_id, year, month);
CREATE INDEX actual_expenses_organization_year_month_idx ON actual_expenses(organization_id, year, month);
CREATE INDEX budget_kpis_organization_year_idx ON budget_kpis(organization_id, year);
CREATE INDEX budget_scenarios_organization_year_idx ON budget_scenarios(organization_id, year); 