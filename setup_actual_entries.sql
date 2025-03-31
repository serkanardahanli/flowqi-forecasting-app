-- Drop de tabel als deze al bestaat
DROP TABLE IF EXISTS actual_entries;

-- Maak de tabel aan
CREATE TABLE actual_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID NOT NULL,
  gl_account_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  category_code VARCHAR(50),
  
  -- Extra velden voor omzet registratie
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  client_name TEXT,
  project_name TEXT,
  number_of_users INTEGER,
  hours INTEGER,
  start_date DATE,
  end_date DATE,
  hourly_rate DECIMAL(12, 2),
  
  -- Foreign key naar gl_accounts
  CONSTRAINT fk_gl_account FOREIGN KEY (gl_account_id) REFERENCES gl_accounts(id) ON DELETE CASCADE,
  
  -- Foreign key naar organizations
  CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexen voor sneller zoeken
CREATE INDEX idx_actual_entries_gl_account ON actual_entries(gl_account_id);
CREATE INDEX idx_actual_entries_organization ON actual_entries(organization_id);
CREATE INDEX idx_actual_entries_year_month ON actual_entries(year, month);
CREATE INDEX idx_actual_entries_type ON actual_entries(type);
CREATE INDEX idx_actual_entries_product ON actual_entries(product_id);

-- Insert GL Accounts
INSERT INTO gl_accounts (code, name, type, level, parent_code, category, balans_type, debet_credit, is_blocked, is_compressed)
VALUES 
-- Level 1: Marketingkosten (Uitgaven)
('4000', 'Marketingkosten', 'Uitgaven', 1, NULL, 'Marketing', 'Winst & Verlies', 'Debet', false, false),

-- Level 2: Online Marketing en Content Marketing (Uitgaven)
('4100', 'Online Marketing', 'Uitgaven', 2, '4000', 'Marketing', 'Winst & Verlies', 'Debet', false, false),
('4200', 'Content Marketing', 'Uitgaven', 2, '4000', 'Marketing', 'Winst & Verlies', 'Debet', false, false),

-- Level 3: Google Ads (Uitgaven) en Omzet (Inkomsten)
('4110', 'Google Ads', 'Uitgaven', 3, '4100', 'Marketing', 'Winst & Verlies', 'Debet', false, false),
('8000', 'Omzet', 'Inkomsten', 3, NULL, 'Omzet', 'Winst & Verlies', 'Credit', false, false); 