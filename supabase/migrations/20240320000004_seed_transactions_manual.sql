-- Insert test data for transactions with a direct organization ID
-- Replace '00000000-0000-0000-0000-000000000000' with the actual organization ID from the previous query
DO $$
DECLARE
    org_id UUID;
BEGIN
    -- Get the organization ID
    SELECT id INTO org_id FROM organizations LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE EXCEPTION 'No organization found';
    END IF;

    -- Consultancy Revenue 2025
    INSERT INTO transactions (organization_id, date, year, month, type, category, amount, description) VALUES
      (org_id, '2025-01-01', 2025, 1, 'revenue', 'consultancy', 43920, 'Consultancy January'),
      (org_id, '2025-02-01', 2025, 2, 'revenue', 'consultancy', 45360, 'Consultancy February'),
      (org_id, '2025-03-01', 2025, 3, 'revenue', 'consultancy', 45360, 'Consultancy March'),
      (org_id, '2025-04-01', 2025, 4, 'revenue', 'consultancy', 45360, 'Consultancy April'),
      (org_id, '2025-05-01', 2025, 5, 'revenue', 'consultancy', 45360, 'Consultancy May'),
      (org_id, '2025-06-01', 2025, 6, 'revenue', 'consultancy', 45360, 'Consultancy June'),
      (org_id, '2025-07-01', 2025, 7, 'revenue', 'consultancy', 41940, 'Consultancy July'),
      (org_id, '2025-08-01', 2025, 8, 'revenue', 'consultancy', 41940, 'Consultancy August'),
      (org_id, '2025-09-01', 2025, 9, 'revenue', 'consultancy', 41940, 'Consultancy September'),
      (org_id, '2025-10-01', 2025, 10, 'revenue', 'consultancy', 27900, 'Consultancy October'),
      (org_id, '2025-11-01', 2025, 11, 'revenue', 'consultancy', 27900, 'Consultancy November'),
      (org_id, '2025-12-01', 2025, 12, 'revenue', 'consultancy', 27900, 'Consultancy December');

    -- SaaS Revenue 2025
    INSERT INTO transactions (organization_id, date, year, month, type, category, amount, description) VALUES
      (org_id, '2025-10-01', 2025, 10, 'revenue', 'saas', 1200, 'SaaS Revenue October'),
      (org_id, '2025-11-01', 2025, 11, 'revenue', 'saas', 4798, 'SaaS Revenue November'),
      (org_id, '2025-12-01', 2025, 12, 'revenue', 'saas', 9596, 'SaaS Revenue December');
      
    -- Personnel Expenses 2025
    INSERT INTO transactions (organization_id, date, year, month, type, category, amount, description) VALUES
      (org_id, '2025-01-01', 2025, 1, 'expense', 'personnel', 12500, 'Personnel January'),
      (org_id, '2025-02-01', 2025, 2, 'expense', 'personnel', 12500, 'Personnel February'),
      (org_id, '2025-03-01', 2025, 3, 'expense', 'personnel', 12500, 'Personnel March'),
      (org_id, '2025-04-01', 2025, 4, 'expense', 'personnel', 12500, 'Personnel April'),
      (org_id, '2025-05-01', 2025, 5, 'expense', 'personnel', 12500, 'Personnel May'),
      (org_id, '2025-06-01', 2025, 6, 'expense', 'personnel', 12500, 'Personnel June'),
      (org_id, '2025-07-01', 2025, 7, 'expense', 'personnel', 12500, 'Personnel July'),
      (org_id, '2025-08-01', 2025, 8, 'expense', 'personnel', 12500, 'Personnel August'),
      (org_id, '2025-09-01', 2025, 9, 'expense', 'personnel', 12500, 'Personnel September'),
      (org_id, '2025-10-01', 2025, 10, 'expense', 'personnel', 12500, 'Personnel October'),
      (org_id, '2025-11-01', 2025, 11, 'expense', 'personnel', 12500, 'Personnel November'),
      (org_id, '2025-12-01', 2025, 12, 'expense', 'personnel', 12500, 'Personnel December');

    -- R&D Expenses 2025
    INSERT INTO transactions (organization_id, date, year, month, type, category, amount, description) VALUES
      (org_id, '2025-01-01', 2025, 1, 'expense', 'rd', 5600, 'R&D January'),
      (org_id, '2025-02-01', 2025, 2, 'expense', 'rd', 5600, 'R&D February'),
      (org_id, '2025-03-01', 2025, 3, 'expense', 'rd', 9600, 'R&D March'),
      (org_id, '2025-04-01', 2025, 4, 'expense', 'rd', 9600, 'R&D April'),
      (org_id, '2025-05-01', 2025, 5, 'expense', 'rd', 9600, 'R&D May'),
      (org_id, '2025-06-01', 2025, 6, 'expense', 'rd', 10600, 'R&D June'),
      (org_id, '2025-07-01', 2025, 7, 'expense', 'rd', 10600, 'R&D July'),
      (org_id, '2025-08-01', 2025, 8, 'expense', 'rd', 10600, 'R&D August'),
      (org_id, '2025-09-01', 2025, 9, 'expense', 'rd', 10600, 'R&D September'),
      (org_id, '2025-10-01', 2025, 10, 'expense', 'rd', 10600, 'R&D October'),
      (org_id, '2025-11-01', 2025, 11, 'expense', 'rd', 10600, 'R&D November'),
      (org_id, '2025-12-01', 2025, 12, 'expense', 'rd', 10600, 'R&D December');

    -- Travel Expenses 2025
    INSERT INTO transactions (organization_id, date, year, month, type, category, amount, description) VALUES
      (org_id, '2025-01-01', 2025, 1, 'expense', 'travel', 6700, 'Travel January'),
      (org_id, '2025-02-01', 2025, 2, 'expense', 'travel', 6700, 'Travel February'),
      (org_id, '2025-03-01', 2025, 3, 'expense', 'travel', 6700, 'Travel March'),
      (org_id, '2025-04-01', 2025, 4, 'expense', 'travel', 6700, 'Travel April'),
      (org_id, '2025-05-01', 2025, 5, 'expense', 'travel', 6700, 'Travel May'),
      (org_id, '2025-06-01', 2025, 6, 'expense', 'travel', 6700, 'Travel June'),
      (org_id, '2025-07-01', 2025, 7, 'expense', 'travel', 6700, 'Travel July'),
      (org_id, '2025-08-01', 2025, 8, 'expense', 'travel', 6700, 'Travel August'),
      (org_id, '2025-09-01', 2025, 9, 'expense', 'travel', 6700, 'Travel September'),
      (org_id, '2025-10-01', 2025, 10, 'expense', 'travel', 6700, 'Travel October'),
      (org_id, '2025-11-01', 2025, 11, 'expense', 'travel', 6700, 'Travel November'),
      (org_id, '2025-12-01', 2025, 12, 'expense', 'travel', 6700, 'Travel December');

    -- Office Expenses 2025
    INSERT INTO transactions (organization_id, date, year, month, type, category, amount, description) VALUES
      (org_id, '2025-01-01', 2025, 1, 'expense', 'office', 4520, 'Office January'),
      (org_id, '2025-02-01', 2025, 2, 'expense', 'office', 4475, 'Office February'),
      (org_id, '2025-03-01', 2025, 3, 'expense', 'office', 4430, 'Office March'),
      (org_id, '2025-04-01', 2025, 4, 'expense', 'office', 4412, 'Office April'),
      (org_id, '2025-05-01', 2025, 5, 'expense', 'office', 4475, 'Office May'),
      (org_id, '2025-06-01', 2025, 6, 'expense', 'office', 4430, 'Office June'),
      (org_id, '2025-07-01', 2025, 7, 'expense', 'office', 4520, 'Office July'),
      (org_id, '2025-08-01', 2025, 8, 'expense', 'office', 4457, 'Office August'),
      (org_id, '2025-09-01', 2025, 9, 'expense', 'office', 4457, 'Office September'),
      (org_id, '2025-10-01', 2025, 10, 'expense', 'office', 4430, 'Office October'),
      (org_id, '2025-11-01', 2025, 11, 'expense', 'office', 4457, 'Office November'),
      (org_id, '2025-12-01', 2025, 12, 'expense', 'office', 4412, 'Office December');

    -- Marketing Expenses 2025
    INSERT INTO transactions (organization_id, date, year, month, type, category, amount, description) VALUES
      (org_id, '2025-01-01', 2025, 1, 'expense', 'marketing', 3500, 'Marketing January'),
      (org_id, '2025-02-01', 2025, 2, 'expense', 'marketing', 3500, 'Marketing February'),
      (org_id, '2025-03-01', 2025, 3, 'expense', 'marketing', 3500, 'Marketing March'),
      (org_id, '2025-04-01', 2025, 4, 'expense', 'marketing', 3500, 'Marketing April'),
      (org_id, '2025-05-01', 2025, 5, 'expense', 'marketing', 3500, 'Marketing May'),
      (org_id, '2025-06-01', 2025, 6, 'expense', 'marketing', 2500, 'Marketing June'),
      (org_id, '2025-07-01', 2025, 7, 'expense', 'marketing', 3500, 'Marketing July'),
      (org_id, '2025-08-01', 2025, 8, 'expense', 'marketing', 3500, 'Marketing August'),
      (org_id, '2025-09-01', 2025, 9, 'expense', 'marketing', 3500, 'Marketing September'),
      (org_id, '2025-10-01', 2025, 10, 'expense', 'marketing', 3500, 'Marketing October'),
      (org_id, '2025-11-01', 2025, 11, 'expense', 'marketing', 3500, 'Marketing November'),
      (org_id, '2025-12-01', 2025, 12, 'expense', 'marketing', 3500, 'Marketing December');

    -- Previous year data for comparison (2024)
    INSERT INTO transactions (organization_id, date, year, month, type, category, amount, description) VALUES
      (org_id, '2024-12-31', 2024, 12, 'revenue', 'consultancy', 658400, '2024 Consultancy Total'),
      (org_id, '2024-12-31', 2024, 12, 'revenue', 'saas', 0, '2024 SaaS Total'),
      (org_id, '2024-12-31', 2024, 12, 'expense', 'personnel', 150000, '2024 Personnel Total'),
      (org_id, '2024-12-31', 2024, 12, 'expense', 'rd', 114200, '2024 R&D Total'),
      (org_id, '2024-12-31', 2024, 12, 'expense', 'travel', 80400, '2024 Travel Total'),
      (org_id, '2024-12-31', 2024, 12, 'expense', 'office', 53475, '2024 Office Total'),
      (org_id, '2024-12-31', 2024, 12, 'expense', 'marketing', 41000, '2024 Marketing Total'),
      (org_id, '2024-12-31', 2024, 12, 'expense', 'support', 0, '2024 Support Total');
END $$; 