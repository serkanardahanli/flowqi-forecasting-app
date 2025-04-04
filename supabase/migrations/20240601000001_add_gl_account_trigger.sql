-- Maak eerst een functie die een product aanmaakt
CREATE OR REPLACE FUNCTION create_product_from_gl_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Alleen voor inkomsten grootboekrekeningen
  IF NEW.type = 'Inkomsten' THEN
    -- Controleer eerst of er al een product bestaat voor deze grootboekrekening
    IF NOT EXISTS (
      SELECT 1 FROM products WHERE gl_account_id = NEW.id
    ) THEN
      INSERT INTO products (
        name,
        description,
        price,
        type,
        is_required,
        gl_account_id,
        organization_id
      ) VALUES (
        NEW.name,
        'Product voor ' || NEW.name,
        29.99, -- standaard prijs
        'saas', -- standaard type
        false,
        NEW.id,
        '00000000-0000-0000-0000-000000000000' -- default organization ID
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Maak een trigger die de functie aanroept wanneer een nieuwe grootboekrekening wordt aangemaakt
DROP TRIGGER IF EXISTS after_gl_account_insert ON gl_accounts;
CREATE TRIGGER after_gl_account_insert
AFTER INSERT ON gl_accounts
FOR EACH ROW
EXECUTE FUNCTION create_product_from_gl_account();

-- Voeg ook een trigger toe voor updates, voor het geval de grootboekrekening wordt gewijzigd
DROP TRIGGER IF EXISTS after_gl_account_update ON gl_accounts;
CREATE TRIGGER after_gl_account_update
AFTER UPDATE ON gl_accounts
FOR EACH ROW
WHEN (OLD.type IS DISTINCT FROM NEW.type OR OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION create_product_from_gl_account();

-- Voeg producten toe voor bestaande grootboekrekeningen die nog geen product hebben
INSERT INTO products (
  name,
  description,
  price,
  type,
  is_required,
  gl_account_id,
  organization_id
)
SELECT 
  g.name,
  'Product voor ' || g.name,
  29.99, -- standaard prijs
  'saas', -- standaard type
  false,
  g.id,
  '00000000-0000-0000-0000-000000000000' -- default organization ID
FROM 
  gl_accounts g
LEFT JOIN 
  products p ON g.id = p.gl_account_id
WHERE 
  g.type = 'Inkomsten'
  AND p.id IS NULL; -- Alleen voor grootboekrekeningen zonder product 