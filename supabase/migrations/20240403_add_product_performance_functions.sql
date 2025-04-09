-- Functie om productprestaties op te halen voor een specifieke periode
CREATE OR REPLACE FUNCTION get_product_performance(
  period_start TEXT,
  period_end TEXT
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  gl_account_id UUID,
  gl_account_code TEXT,
  gl_account_name TEXT,
  actual_revenue NUMERIC,
  planned_revenue NUMERIC,
  actual_quantity INTEGER,
  planned_quantity INTEGER,
  actual_profit NUMERIC,
  planned_profit NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    g.id AS gl_account_id,
    g.code AS gl_account_code,
    g.name AS gl_account_name,
    COALESCE(SUM(sd.revenue), 0) AS actual_revenue,
    COALESCE(SUM(ps.revenue), 0) AS planned_revenue,
    COALESCE(SUM(sd.quantity), 0) AS actual_quantity,
    COALESCE(SUM(ps.quantity), 0) AS planned_quantity,
    COALESCE(SUM(sd.profit), 0) AS actual_profit,
    COALESCE(SUM(ps.profit), 0) AS planned_profit
  FROM 
    products p
    LEFT JOIN gl_accounts g ON p.gl_account_id = g.id
    LEFT JOIN sales_data sd ON p.id = sd.product_id 
      AND sd.period >= period_start 
      AND sd.period <= period_end
    LEFT JOIN planned_sales ps ON p.id = ps.product_id 
      AND ps.period >= period_start 
      AND ps.period <= period_end
  GROUP BY 
    p.id, p.name, g.id, g.code, g.name
  ORDER BY 
    actual_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Functie om productprestaties op te halen voor een specifiek kwartaal
CREATE OR REPLACE FUNCTION get_product_performance_by_quarter(
  year INTEGER,
  quarter INTEGER
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  gl_account_id UUID,
  gl_account_code TEXT,
  gl_account_name TEXT,
  actual_revenue NUMERIC,
  planned_revenue NUMERIC,
  actual_quantity INTEGER,
  planned_quantity INTEGER,
  actual_profit NUMERIC,
  planned_profit NUMERIC
) AS $$
DECLARE
  start_month INTEGER;
  end_month INTEGER;
  period_start TEXT;
  period_end TEXT;
BEGIN
  -- Bereken start- en eindmaand voor het kwartaal
  start_month := (quarter - 1) * 3 + 1;
  end_month := quarter * 3;
  
  -- Format period_start en period_end
  period_start := year || '-' || LPAD(start_month::TEXT, 2, '0');
  period_end := year || '-' || LPAD(end_month::TEXT, 2, '0');
  
  RETURN QUERY
  SELECT * FROM get_product_performance(period_start, period_end);
END;
$$ LANGUAGE plpgsql;

-- Functie om productprestaties op te halen voor een specifiek jaar
CREATE OR REPLACE FUNCTION get_product_performance_by_year(
  year INTEGER
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  gl_account_id UUID,
  gl_account_code TEXT,
  gl_account_name TEXT,
  actual_revenue NUMERIC,
  planned_revenue NUMERIC,
  actual_quantity INTEGER,
  planned_quantity INTEGER,
  actual_profit NUMERIC,
  planned_profit NUMERIC
) AS $$
DECLARE
  period_start TEXT;
  period_end TEXT;
BEGIN
  -- Format period_start en period_end voor het hele jaar
  period_start := year || '-01';
  period_end := year || '-12';
  
  RETURN QUERY
  SELECT * FROM get_product_performance(period_start, period_end);
END;
$$ LANGUAGE plpgsql; 