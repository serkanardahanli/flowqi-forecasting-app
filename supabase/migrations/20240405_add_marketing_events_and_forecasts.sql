-- Tabel voor marketing events
CREATE TABLE IF NOT EXISTS marketing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'Beurs', 'Campagne', 'Webinar', etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  expected_leads INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel voor product voorspellingen
CREATE TABLE IF NOT EXISTS product_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  gl_account_id UUID REFERENCES gl_accounts(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  forecasted_quantity INTEGER NOT NULL DEFAULT 0,
  marketing_event_id UUID REFERENCES marketing_events(id), -- Optionele koppeling met event
  notes TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, year, month, organization_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_marketing_events_organization ON marketing_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_dates ON marketing_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_product_forecasts_product ON product_forecasts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_forecasts_period ON product_forecasts(year, month);
CREATE INDEX IF NOT EXISTS idx_product_forecasts_organization ON product_forecasts(organization_id);

-- Add RLS policies
ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_forecasts ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to view marketing_events" 
  ON marketing_events FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert marketing_events" 
  ON marketing_events FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update marketing_events" 
  ON marketing_events FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete marketing_events" 
  ON marketing_events FOR DELETE 
  TO authenticated 
  USING (true);

-- Create policies for product_forecasts
CREATE POLICY "Allow authenticated users to view product_forecasts" 
  ON product_forecasts FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert product_forecasts" 
  ON product_forecasts FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update product_forecasts" 
  ON product_forecasts FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete product_forecasts" 
  ON product_forecasts FOR DELETE 
  TO authenticated 
  USING (true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_marketing_events_updated_at
BEFORE UPDATE ON marketing_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_forecasts_updated_at
BEFORE UPDATE ON product_forecasts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 