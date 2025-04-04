-- Maak de product_groups tabel aan
CREATE TABLE IF NOT EXISTS product_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Voeg de group_id kolom toe aan de products tabel
ALTER TABLE products
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES product_groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false;

-- Update de type check constraint om 'service' toe te voegen
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_type_check;

ALTER TABLE products 
ADD CONSTRAINT products_type_check 
CHECK (type IN ('saas', 'hardware', 'service', 'consultancy'));

-- Maak een trigger voor het bijwerken van updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Voeg triggers toe voor beide tabellen
DROP TRIGGER IF EXISTS update_product_groups_updated_at ON product_groups;
CREATE TRIGGER update_product_groups_updated_at
    BEFORE UPDATE ON product_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Voeg RLS policies toe voor product_groups
ALTER TABLE product_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product_groups they own"
ON product_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = product_groups.organization_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage product_groups they own"
ON product_groups
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = product_groups.organization_id
    AND owner_id = auth.uid()
  )
); 