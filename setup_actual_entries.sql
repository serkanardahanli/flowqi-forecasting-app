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
  
  -- Foreign key naar gl_accounts
  CONSTRAINT fk_gl_account FOREIGN KEY (gl_account_id) REFERENCES gl_accounts(id) ON DELETE CASCADE,
  
  -- Foreign key naar organizations (als die tabel bestaat)
  CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexen voor sneller zoeken
CREATE INDEX idx_actual_entries_gl_account ON actual_entries(gl_account_id);
CREATE INDEX idx_actual_entries_organization ON actual_entries(organization_id);
CREATE INDEX idx_actual_entries_year_month ON actual_entries(year, month);
CREATE INDEX idx_actual_entries_type ON actual_entries(type);

-- RLS (Row Level Security) policies
ALTER TABLE actual_entries ENABLE ROW LEVEL SECURITY;

-- Maak een policy die gebruikers alleen hun eigen organisatie data laat zien
CREATE POLICY "Users can view entries from their organization" ON actual_entries
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Maak een policy die gebruikers alleen hun eigen organisatie data laat toevoegen
CREATE POLICY "Users can insert entries to their organization" ON actual_entries
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Maak een policy die gebruikers alleen hun eigen organisatie data laat wijzigen
CREATE POLICY "Users can update entries from their organization" ON actual_entries
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Maak een policy die gebruikers alleen hun eigen organisatie data laat verwijderen
CREATE POLICY "Users can delete entries from their organization" ON actual_entries
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Geef permissies aan authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON actual_entries TO authenticated; 