-- Create sales_data table for actual sales
CREATE TABLE IF NOT EXISTS sales_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  period VARCHAR(7), -- YYYY-MM format
  year INT,
  month INT,
  quarter INT,
  quantity INT DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  cost DECIMAL(12,2) DEFAULT 0,
  profit DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create planned_sales table for planned sales
CREATE TABLE IF NOT EXISTS planned_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  period VARCHAR(7), -- YYYY-MM format
  year INT,
  month INT,
  quarter INT,
  quantity INT DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  cost DECIMAL(12,2) DEFAULT 0,
  profit DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_data_period ON sales_data(period);
CREATE INDEX IF NOT EXISTS idx_sales_data_product_id ON sales_data(product_id);
CREATE INDEX IF NOT EXISTS idx_planned_sales_period ON planned_sales(period);
CREATE INDEX IF NOT EXISTS idx_planned_sales_product_id ON planned_sales(product_id);

-- Add RLS policies
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_sales ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to view sales_data" 
  ON sales_data FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert sales_data" 
  ON sales_data FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sales_data" 
  ON sales_data FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete sales_data" 
  ON sales_data FOR DELETE 
  TO authenticated 
  USING (true);

-- Create policies for planned_sales
CREATE POLICY "Allow authenticated users to view planned_sales" 
  ON planned_sales FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert planned_sales" 
  ON planned_sales FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update planned_sales" 
  ON planned_sales FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete planned_sales" 
  ON planned_sales FOR DELETE 
  TO authenticated 
  USING (true); 