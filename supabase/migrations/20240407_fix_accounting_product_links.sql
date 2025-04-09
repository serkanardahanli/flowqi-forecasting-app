-- Fix de disconnect tussen accounting en product rapportages

-- Functie om producten te koppelen aan grootboekrekeningen
CREATE OR REPLACE FUNCTION link_products_to_gl_accounts()
RETURNS void AS $$
BEGIN
  -- Koppel producten aan grootboekrekeningen van type 'Inkomsten'
  UPDATE products p
  SET gl_account_id = ga.id
  FROM gl_accounts ga
  WHERE ga.type = 'Inkomsten'
  AND p.gl_account_id IS NULL
  AND p.name ILIKE '%' || ga.name || '%';
  
  -- Update actual_entries met product_id waar deze nog ontbreekt
  UPDATE actual_entries ae
  SET product_id = p.id
  FROM products p
  WHERE ae.gl_account_id = p.gl_account_id
  AND ae.product_id IS NULL
  AND ae.entry_type = 'revenue';
  
  -- Update budget_entries met product_id waar deze nog ontbreekt
  UPDATE budget_entries be
  SET product_id = p.id
  FROM products p
  WHERE be.gl_account_id = p.gl_account_id
  AND be.product_id IS NULL
  AND be.type = 'revenue';
END;
$$ LANGUAGE plpgsql;

-- Voer de functie uit
SELECT link_products_to_gl_accounts();

-- Maak een trigger functie om automatisch producten te koppelen aan nieuwe entries
CREATE OR REPLACE FUNCTION auto_link_product_to_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Als er geen product_id is maar wel een gl_account_id, probeer een product te vinden
  IF NEW.product_id IS NULL AND NEW.gl_account_id IS NOT NULL THEN
    -- Zoek een product met dezelfde gl_account_id
    SELECT id INTO NEW.product_id
    FROM products
    WHERE gl_account_id = NEW.gl_account_id
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Maak triggers voor actual_entries en budget_entries
DROP TRIGGER IF EXISTS auto_link_product_to_actual_entry ON actual_entries;
CREATE TRIGGER auto_link_product_to_actual_entry
BEFORE INSERT OR UPDATE ON actual_entries
FOR EACH ROW
EXECUTE FUNCTION auto_link_product_to_entry();

DROP TRIGGER IF EXISTS auto_link_product_to_budget_entry ON budget_entries;
CREATE TRIGGER auto_link_product_to_budget_entry
BEFORE INSERT OR UPDATE ON budget_entries
FOR EACH ROW
EXECUTE FUNCTION auto_link_product_to_entry();

-- Maak een view om de mapping tussen producten en grootboekrekeningen te tonen
CREATE OR REPLACE VIEW product_gl_account_mapping AS
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  p.type AS product_type,
  ga.id AS gl_account_id,
  ga.code AS gl_account_code,
  ga.name AS gl_account_name
FROM products p
JOIN gl_accounts ga ON p.gl_account_id = ga.id
WHERE ga.type = 'Inkomsten';

-- Maak een functie om product performance te berekenen
CREATE OR REPLACE FUNCTION calculate_product_performance(p_year INTEGER, p_month INTEGER)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_type TEXT,
  unit TEXT,
  planned_quantity NUMERIC,
  planned_revenue NUMERIC,
  actual_quantity NUMERIC,
  actual_revenue NUMERIC,
  achievement_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH product_data AS (
    -- Haal producten op
    SELECT 
      p.id,
      p.name,
      p.type,
      CASE WHEN p.type = 'consultancy' THEN 'uren' ELSE 'gebruikers' END AS unit
    FROM products p
  ),
  planned_data AS (
    -- Haal geplande data op
    SELECT 
      be.product_id,
      SUM(be.number_of_users) AS planned_quantity,
      SUM(be.amount) AS planned_revenue
    FROM budget_entries be
    WHERE be.year = p_year
    AND be.month = p_month
    AND be.type = 'revenue'
    GROUP BY be.product_id
  ),
  actual_data AS (
    -- Haal werkelijke data op
    SELECT 
      ae.product_id,
      SUM(ae.number_of_users) AS actual_quantity,
      SUM(ae.amount) AS actual_revenue
    FROM actual_entries ae
    WHERE EXTRACT(YEAR FROM ae.entry_date) = p_year
    AND EXTRACT(MONTH FROM ae.entry_date) = p_month
    AND ae.entry_type = 'revenue'
    GROUP BY ae.product_id
  )
  -- Combineer de data
  SELECT 
    pd.id AS product_id,
    pd.name AS product_name,
    pd.type AS product_type,
    pd.unit,
    COALESCE(pd2.planned_quantity, 0) AS planned_quantity,
    COALESCE(pd2.planned_revenue, 0) AS planned_revenue,
    COALESCE(ad.actual_quantity, 0) AS actual_quantity,
    COALESCE(ad.actual_revenue, 0) AS actual_revenue,
    CASE 
      WHEN COALESCE(pd2.planned_revenue, 0) > 0 
      THEN ROUND((COALESCE(ad.actual_revenue, 0) / COALESCE(pd2.planned_revenue, 0) * 100), 2)
      ELSE 0 
    END AS achievement_percentage
  FROM product_data pd
  LEFT JOIN planned_data pd2 ON pd.id = pd2.product_id
  LEFT JOIN actual_data ad ON pd.id = ad.product_id
  ORDER BY pd.name;
END;
$$ LANGUAGE plpgsql; 