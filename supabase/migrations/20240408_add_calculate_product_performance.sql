-- Add the calculate_product_performance function to the database
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