-- Maak eerst de products tabel aan
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('SaaS', 'Consultancy')),
  name TEXT NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Maak de planned_saas_revenue tabel aan
CREATE TABLE IF NOT EXISTS planned_saas_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  users INTEGER NOT NULL DEFAULT 0,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, month, year, organization_id)
);

-- Maak de planned_consultancy_revenue tabel aan
CREATE TABLE IF NOT EXISTS planned_consultancy_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hourly_rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
  hours_per_month INTEGER[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0}'::INTEGER[],
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Als de budget_entries tabel nog niet bestaat, maak deze aan
CREATE TABLE IF NOT EXISTS budget_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gl_account_id UUID NOT NULL REFERENCES gl_accounts(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('Planned', 'Actual')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(gl_account_id, month, year, type, organization_id)
);

-- Zet RLS aan voor de nieuwe tabellen
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_saas_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_consultancy_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;

-- Voeg RLS policies toe voor products
CREATE POLICY "Users can view products they own"
ON products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = products.organization_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage products they own"
ON products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = products.organization_id
    AND owner_id = auth.uid()
  )
);

-- Voeg RLS policies toe voor planned_saas_revenue
CREATE POLICY "Users can view planned_saas_revenue they own"
ON planned_saas_revenue
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = planned_saas_revenue.organization_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage planned_saas_revenue they own"
ON planned_saas_revenue
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = planned_saas_revenue.organization_id
    AND owner_id = auth.uid()
  )
);

-- Voeg RLS policies toe voor planned_consultancy_revenue
CREATE POLICY "Users can view planned_consultancy_revenue they own"
ON planned_consultancy_revenue
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = planned_consultancy_revenue.organization_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage planned_consultancy_revenue they own"
ON planned_consultancy_revenue
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = planned_consultancy_revenue.organization_id
    AND owner_id = auth.uid()
  )
);

-- Voeg RLS policies toe voor budget_entries
CREATE POLICY "Users can view budget_entries they own"
ON budget_entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = budget_entries.organization_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage budget_entries they own"
ON budget_entries
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = budget_entries.organization_id
    AND owner_id = auth.uid()
  )
); 