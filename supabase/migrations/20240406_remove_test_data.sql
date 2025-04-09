-- Verwijder test data uit de database
-- Dit script verwijdert alle handmatig ingevoerde testdata die niet via de applicatie is ingevoerd

-- Verwijder test data uit product_sales
DELETE FROM product_sales 
WHERE created_at < NOW() - INTERVAL '1 day' 
  AND created_by = 'system' 
  AND notes LIKE '%test%';

-- Verwijder test data uit planned_sales
DELETE FROM planned_sales 
WHERE created_at < NOW() - INTERVAL '1 day' 
  AND created_by = 'system' 
  AND notes LIKE '%test%';

-- Verwijder test data uit actual_entries
DELETE FROM actual_entries 
WHERE created_at < NOW() - INTERVAL '1 day' 
  AND created_by = 'system' 
  AND notes LIKE '%test%';

-- Verwijder test data uit budget_entries
DELETE FROM budget_entries 
WHERE created_at < NOW() - INTERVAL '1 day' 
  AND created_by = 'system' 
  AND notes LIKE '%test%';

-- Verwijder test data uit marketing_events
DELETE FROM marketing_events 
WHERE created_at < NOW() - INTERVAL '1 day' 
  AND created_by = 'system' 
  AND notes LIKE '%test%';

-- Verwijder test data uit product_forecasts
DELETE FROM product_forecasts 
WHERE created_at < NOW() - INTERVAL '1 day' 
  AND created_by = 'system' 
  AND notes LIKE '%test%';

-- Voeg een kolom toe aan de relevante tabellen om bij te houden hoe de data is ingevoerd
ALTER TABLE product_sales ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'application';
ALTER TABLE planned_sales ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'application';
ALTER TABLE actual_entries ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'application';
ALTER TABLE budget_entries ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'application';
ALTER TABLE marketing_events ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'application';
ALTER TABLE product_forecasts ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'application';

-- Update bestaande records om aan te geven dat ze via de applicatie zijn ingevoerd
UPDATE product_sales SET data_source = 'application' WHERE data_source IS NULL;
UPDATE planned_sales SET data_source = 'application' WHERE data_source IS NULL;
UPDATE actual_entries SET data_source = 'application' WHERE data_source IS NULL;
UPDATE budget_entries SET data_source = 'application' WHERE data_source IS NULL;
UPDATE marketing_events SET data_source = 'application' WHERE data_source IS NULL;
UPDATE product_forecasts SET data_source = 'application' WHERE data_source IS NULL;

-- Verwijder test data (records met 'test' in de notes en ouder dan 1 dag)
DELETE FROM product_sales WHERE notes ILIKE '%test%' AND created_at < NOW() - INTERVAL '1 day';
DELETE FROM planned_sales WHERE notes ILIKE '%test%' AND created_at < NOW() - INTERVAL '1 day';
DELETE FROM actual_entries WHERE notes ILIKE '%test%' AND created_at < NOW() - INTERVAL '1 day';
DELETE FROM budget_entries WHERE notes ILIKE '%test%' AND created_at < NOW() - INTERVAL '1 day';
DELETE FROM marketing_events WHERE notes ILIKE '%test%' AND created_at < NOW() - INTERVAL '1 day';
DELETE FROM product_forecasts WHERE notes ILIKE '%test%' AND created_at < NOW() - INTERVAL '1 day'; 