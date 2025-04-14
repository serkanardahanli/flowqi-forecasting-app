-- Create GL accounts table
CREATE TABLE IF NOT EXISTS gl_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  balans_type VARCHAR(50),
  debet_credit VARCHAR(50),
  exact_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, code)
);

-- Create sync logs table
CREATE TABLE IF NOT EXISTS exact_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE gl_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exact_sync_logs ENABLE ROW LEVEL SECURITY;

-- GL accounts policies
CREATE POLICY "Users can view their organization's GL accounts"
  ON gl_accounts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's GL accounts"
  ON gl_accounts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Sync logs policies
CREATE POLICY "Users can view their organization's sync logs"
  ON exact_sync_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sync logs for their organization"
  ON exact_sync_logs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's sync logs"
  ON exact_sync_logs FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX idx_gl_accounts_organization_id ON gl_accounts(organization_id);
CREATE INDEX idx_gl_accounts_code ON gl_accounts(code);
CREATE INDEX idx_exact_sync_logs_organization_id ON exact_sync_logs(organization_id);
CREATE INDEX idx_exact_sync_logs_sync_type ON exact_sync_logs(sync_type);
CREATE INDEX idx_exact_sync_logs_status ON exact_sync_logs(status); 