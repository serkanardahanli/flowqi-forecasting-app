-- Create exact_tokens table
CREATE TABLE IF NOT EXISTS exact_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_in INTEGER NOT NULL,
    token_type TEXT NOT NULL,
    division INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create exact_sync_logs table
CREATE TABLE IF NOT EXISTS exact_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type TEXT NOT NULL,
    status TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    records_processed INTEGER,
    records_created INTEGER,
    records_updated INTEGER,
    records_failed INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE exact_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE exact_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies for exact_tokens
CREATE POLICY "Users can view their organization's exact tokens"
    ON exact_tokens FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their organization's exact tokens"
    ON exact_tokens FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their organization's exact tokens"
    ON exact_tokens FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

-- Policies for exact_sync_logs
CREATE POLICY "Users can view their organization's sync logs"
    ON exact_sync_logs FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their organization's sync logs"
    ON exact_sync_logs FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their organization's sync logs"
    ON exact_sync_logs FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

-- Add indexes
CREATE INDEX idx_exact_tokens_organization_id ON exact_tokens(organization_id);
CREATE INDEX idx_exact_sync_logs_organization_id ON exact_sync_logs(organization_id);
CREATE INDEX idx_exact_sync_logs_created_at ON exact_sync_logs(created_at); 