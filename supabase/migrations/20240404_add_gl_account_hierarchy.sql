-- Voeg hiërarchische velden toe aan gl_accounts tabel
ALTER TABLE gl_accounts 
ADD COLUMN IF NOT EXISTS parent_code TEXT,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Voeg een index toe voor snellere zoekopdrachten op parent_code
CREATE INDEX IF NOT EXISTS idx_gl_accounts_parent_code ON gl_accounts(parent_code);

-- Update bestaande rekeningen met hiërarchische informatie
UPDATE gl_accounts
SET level = 1, parent_code = NULL
WHERE code IN ('8000', '9000', '1000', '2000', '3000', '4000', '5000', '6000', '7000');

UPDATE gl_accounts
SET level = 2, parent_code = '8000'
WHERE code IN ('8010', '8020', '8030', '8040', '8050');

UPDATE gl_accounts
SET level = 3, parent_code = '8010'
WHERE code LIKE '801%' AND code != '8010';

UPDATE gl_accounts
SET level = 3, parent_code = '8020'
WHERE code LIKE '802%' AND code != '8020';

UPDATE gl_accounts
SET level = 3, parent_code = '8030'
WHERE code LIKE '803%' AND code != '8030';

UPDATE gl_accounts
SET level = 3, parent_code = '8040'
WHERE code LIKE '804%' AND code != '8040';

UPDATE gl_accounts
SET level = 3, parent_code = '8050'
WHERE code LIKE '805%' AND code != '8050';

-- Functie om hiërarchische grootboekrekeningen op te halen
CREATE OR REPLACE FUNCTION get_gl_account_hierarchy()
RETURNS TABLE (
  id UUID,
  code TEXT,
  name TEXT,
  parent_code TEXT,
  level INTEGER,
  depth INTEGER,
  path TEXT,
  display_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE account_hierarchy AS (
    -- Basis: rekeningen op het hoogste niveau (level 1)
    SELECT 
      id, code, name, parent_code, level, 
      0 AS depth,
      code::text AS path
    FROM gl_accounts
    WHERE level = 1
    
    UNION ALL
    
    -- Recursief: onderliggende rekeningen
    SELECT 
      g.id, g.code, g.name, g.parent_code, g.level,
      ah.depth + 1,
      ah.path || '.' || g.code::text
    FROM gl_accounts g
    JOIN account_hierarchy ah ON g.parent_code = ah.code
  )
  SELECT 
    id, code, name, parent_code, level, depth, path,
    -- Inspringing toevoegen voor de weergave
    REPEAT('    ', depth) || name AS display_name
  FROM account_hierarchy
  ORDER BY path;
END;
$$ LANGUAGE plpgsql;

-- Functie om hiërarchische omzetberekeningen op te halen
CREATE OR REPLACE FUNCTION get_gl_revenue_hierarchy(
  period_start TEXT,
  period_end TEXT
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  name TEXT,
  level INTEGER,
  depth INTEGER,
  path TEXT,
  display_name TEXT,
  actual_revenue NUMERIC,
  planned_revenue NUMERIC,
  actual_quantity INTEGER,
  planned_quantity INTEGER,
  actual_profit NUMERIC,
  planned_profit NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE account_hierarchy AS (
    -- Basis: rekeningen op het hoogste niveau (level 1)
    SELECT 
      id, code, name, parent_code, level, 
      0 AS depth,
      code::text AS path
    FROM gl_accounts
    WHERE level = 1
    
    UNION ALL
    
    -- Recursief: onderliggende rekeningen
    SELECT 
      g.id, g.code, g.name, g.parent_code, g.level,
      ah.depth + 1,
      ah.path || '.' || g.code::text
    FROM gl_accounts g
    JOIN account_hierarchy ah ON g.parent_code = ah.code
  ),
  sales_summary AS (
    SELECT 
      g.id,
      g.code,
      g.name,
      g.parent_code,
      g.level,
      COALESCE(SUM(sd.revenue), 0) AS actual_revenue,
      COALESCE(SUM(ps.revenue), 0) AS planned_revenue,
      COALESCE(SUM(sd.quantity), 0) AS actual_quantity,
      COALESCE(SUM(ps.quantity), 0) AS planned_quantity,
      COALESCE(SUM(sd.profit), 0) AS actual_profit,
      COALESCE(SUM(ps.profit), 0) AS planned_profit
    FROM 
      gl_accounts g
    LEFT JOIN 
      products p ON g.id = p.gl_account_id
    LEFT JOIN 
      sales_data sd ON p.id = sd.product_id 
        AND sd.period >= period_start 
        AND sd.period <= period_end
    LEFT JOIN 
      planned_sales ps ON p.id = ps.product_id 
        AND ps.period >= period_start 
        AND ps.period <= period_end
    GROUP BY
      g.id, g.code, g.name, g.parent_code, g.level
  ),
  rollup_revenues AS (
    SELECT
      g.id,
      g.code,
      g.name,
      g.level,
      ah.depth,
      ah.path,
      REPEAT('    ', ah.depth) || g.name AS display_name,
      COALESCE(s.actual_revenue, 0) +
        (SELECT COALESCE(SUM(ss.actual_revenue), 0)
         FROM sales_summary ss
         JOIN gl_accounts gc ON ss.code = gc.code
         WHERE gc.parent_code = g.code) AS actual_revenue,
      COALESCE(s.planned_revenue, 0) +
        (SELECT COALESCE(SUM(ss.planned_revenue), 0)
         FROM sales_summary ss
         JOIN gl_accounts gc ON ss.code = gc.code
         WHERE gc.parent_code = g.code) AS planned_revenue,
      COALESCE(s.actual_quantity, 0) +
        (SELECT COALESCE(SUM(ss.actual_quantity), 0)
         FROM sales_summary ss
         JOIN gl_accounts gc ON ss.code = gc.code
         WHERE gc.parent_code = g.code) AS actual_quantity,
      COALESCE(s.planned_quantity, 0) +
        (SELECT COALESCE(SUM(ss.planned_quantity), 0)
         FROM sales_summary ss
         JOIN gl_accounts gc ON ss.code = gc.code
         WHERE gc.parent_code = g.code) AS planned_quantity,
      COALESCE(s.actual_profit, 0) +
        (SELECT COALESCE(SUM(ss.actual_profit), 0)
         FROM sales_summary ss
         JOIN gl_accounts gc ON ss.code = gc.code
         WHERE gc.parent_code = g.code) AS actual_profit,
      COALESCE(s.planned_profit, 0) +
        (SELECT COALESCE(SUM(ss.planned_profit), 0)
         FROM sales_summary ss
         JOIN gl_accounts gc ON ss.code = gc.code
         WHERE gc.parent_code = g.code) AS planned_profit
    FROM
      gl_accounts g
    JOIN
      account_hierarchy ah ON g.id = ah.id
    LEFT JOIN
      sales_summary s ON g.id = s.id
    WHERE
      g.code LIKE '8%' -- Alleen omzetrekeningen
  )
  SELECT
    id, code, name, level, depth, path, display_name,
    actual_revenue, planned_revenue, actual_quantity, planned_quantity,
    actual_profit, planned_profit
  FROM
    rollup_revenues
  ORDER BY
    path;
END;
$$ LANGUAGE plpgsql;

-- Functie om hiërarchische omzetberekeningen op te halen voor een kwartaal
CREATE OR REPLACE FUNCTION get_gl_revenue_hierarchy_by_quarter(
  year INTEGER,
  quarter INTEGER
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  name TEXT,
  level INTEGER,
  depth INTEGER,
  path TEXT,
  display_name TEXT,
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
  SELECT * FROM get_gl_revenue_hierarchy(period_start, period_end);
END;
$$ LANGUAGE plpgsql;

-- Functie om hiërarchische omzetberekeningen op te halen voor een jaar
CREATE OR REPLACE FUNCTION get_gl_revenue_hierarchy_by_year(
  year INTEGER
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  name TEXT,
  level INTEGER,
  depth INTEGER,
  path TEXT,
  display_name TEXT,
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
  SELECT * FROM get_gl_revenue_hierarchy(period_start, period_end);
END;
$$ LANGUAGE plpgsql; 