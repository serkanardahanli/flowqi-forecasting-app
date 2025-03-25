-- Insert test data for transactions
INSERT INTO transactions (organization_id, date, year, month, type, category, amount, description)
SELECT 
  (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() LIMIT 1),
  date,
  EXTRACT(YEAR FROM date)::integer as year,
  EXTRACT(MONTH FROM date)::integer as month,
  type,
  category,
  amount,
  description
FROM (
  VALUES
    -- Consultancy Revenue 2025
    ('2025-01-01', 'revenue', 'consultancy', 43920, 'Consultancy January'),
    ('2025-02-01', 'revenue', 'consultancy', 45360, 'Consultancy February'),
    ('2025-03-01', 'revenue', 'consultancy', 45360, 'Consultancy March'),
    ('2025-04-01', 'revenue', 'consultancy', 45360, 'Consultancy April'),
    ('2025-05-01', 'revenue', 'consultancy', 45360, 'Consultancy May'),
    ('2025-06-01', 'revenue', 'consultancy', 45360, 'Consultancy June'),
    ('2025-07-01', 'revenue', 'consultancy', 41940, 'Consultancy July'),
    ('2025-08-01', 'revenue', 'consultancy', 41940, 'Consultancy August'),
    ('2025-09-01', 'revenue', 'consultancy', 41940, 'Consultancy September'),
    ('2025-10-01', 'revenue', 'consultancy', 27900, 'Consultancy October'),
    ('2025-11-01', 'revenue', 'consultancy', 27900, 'Consultancy November'),
    ('2025-12-01', 'revenue', 'consultancy', 27900, 'Consultancy December'),

    -- SaaS Revenue 2025
    ('2025-10-01', 'revenue', 'saas', 1200, 'SaaS Revenue October'),
    ('2025-11-01', 'revenue', 'saas', 4798, 'SaaS Revenue November'),
    ('2025-12-01', 'revenue', 'saas', 9596, 'SaaS Revenue December'),

    -- Personnel Expenses 2025
    ('2025-01-01', 'expense', 'personnel', 12500, 'Personnel January'),
    ('2025-02-01', 'expense', 'personnel', 12500, 'Personnel February'),
    ('2025-03-01', 'expense', 'personnel', 12500, 'Personnel March'),
    ('2025-04-01', 'expense', 'personnel', 12500, 'Personnel April'),
    ('2025-05-01', 'expense', 'personnel', 12500, 'Personnel May'),
    ('2025-06-01', 'expense', 'personnel', 12500, 'Personnel June'),
    ('2025-07-01', 'expense', 'personnel', 12500, 'Personnel July'),
    ('2025-08-01', 'expense', 'personnel', 12500, 'Personnel August'),
    ('2025-09-01', 'expense', 'personnel', 12500, 'Personnel September'),
    ('2025-10-01', 'expense', 'personnel', 12500, 'Personnel October'),
    ('2025-11-01', 'expense', 'personnel', 12500, 'Personnel November'),
    ('2025-12-01', 'expense', 'personnel', 12500, 'Personnel December'),

    -- R&D Expenses 2025
    ('2025-01-01', 'expense', 'rd', 5600, 'R&D January'),
    ('2025-02-01', 'expense', 'rd', 5600, 'R&D February'),
    ('2025-03-01', 'expense', 'rd', 9600, 'R&D March'),
    ('2025-04-01', 'expense', 'rd', 9600, 'R&D April'),
    ('2025-05-01', 'expense', 'rd', 9600, 'R&D May'),
    ('2025-06-01', 'expense', 'rd', 10600, 'R&D June'),
    ('2025-07-01', 'expense', 'rd', 10600, 'R&D July'),
    ('2025-08-01', 'expense', 'rd', 10600, 'R&D August'),
    ('2025-09-01', 'expense', 'rd', 10600, 'R&D September'),
    ('2025-10-01', 'expense', 'rd', 10600, 'R&D October'),
    ('2025-11-01', 'expense', 'rd', 10600, 'R&D November'),
    ('2025-12-01', 'expense', 'rd', 10600, 'R&D December'),

    -- Travel Expenses 2025
    ('2025-01-01', 'expense', 'travel', 6700, 'Travel January'),
    ('2025-02-01', 'expense', 'travel', 6700, 'Travel February'),
    ('2025-03-01', 'expense', 'travel', 6700, 'Travel March'),
    ('2025-04-01', 'expense', 'travel', 6700, 'Travel April'),
    ('2025-05-01', 'expense', 'travel', 6700, 'Travel May'),
    ('2025-06-01', 'expense', 'travel', 6700, 'Travel June'),
    ('2025-07-01', 'expense', 'travel', 6700, 'Travel July'),
    ('2025-08-01', 'expense', 'travel', 6700, 'Travel August'),
    ('2025-09-01', 'expense', 'travel', 6700, 'Travel September'),
    ('2025-10-01', 'expense', 'travel', 6700, 'Travel October'),
    ('2025-11-01', 'expense', 'travel', 6700, 'Travel November'),
    ('2025-12-01', 'expense', 'travel', 6700, 'Travel December'),

    -- Office Expenses 2025
    ('2025-01-01', 'expense', 'office', 4520, 'Office January'),
    ('2025-02-01', 'expense', 'office', 4475, 'Office February'),
    ('2025-03-01', 'expense', 'office', 4430, 'Office March'),
    ('2025-04-01', 'expense', 'office', 4412, 'Office April'),
    ('2025-05-01', 'expense', 'office', 4475, 'Office May'),
    ('2025-06-01', 'expense', 'office', 4430, 'Office June'),
    ('2025-07-01', 'expense', 'office', 4520, 'Office July'),
    ('2025-08-01', 'expense', 'office', 4457, 'Office August'),
    ('2025-09-01', 'expense', 'office', 4457, 'Office September'),
    ('2025-10-01', 'expense', 'office', 4430, 'Office October'),
    ('2025-11-01', 'expense', 'office', 4457, 'Office November'),
    ('2025-12-01', 'expense', 'office', 4412, 'Office December'),

    -- Marketing Expenses 2025
    ('2025-01-01', 'expense', 'marketing', 3500, 'Marketing January'),
    ('2025-02-01', 'expense', 'marketing', 3500, 'Marketing February'),
    ('2025-03-01', 'expense', 'marketing', 3500, 'Marketing March'),
    ('2025-04-01', 'expense', 'marketing', 3500, 'Marketing April'),
    ('2025-05-01', 'expense', 'marketing', 3500, 'Marketing May'),
    ('2025-06-01', 'expense', 'marketing', 2500, 'Marketing June'),
    ('2025-07-01', 'expense', 'marketing', 3500, 'Marketing July'),
    ('2025-08-01', 'expense', 'marketing', 3500, 'Marketing August'),
    ('2025-09-01', 'expense', 'marketing', 3500, 'Marketing September'),
    ('2025-10-01', 'expense', 'marketing', 3500, 'Marketing October'),
    ('2025-11-01', 'expense', 'marketing', 3500, 'Marketing November'),
    ('2025-12-01', 'expense', 'marketing', 3500, 'Marketing December'),

    -- Previous year data for comparison (2024)
    ('2024-12-31', 'revenue', 'consultancy', 658400, '2024 Consultancy Total'),
    ('2024-12-31', 'revenue', 'saas', 0, '2024 SaaS Total'),
    ('2024-12-31', 'expense', 'personnel', 150000, '2024 Personnel Total'),
    ('2024-12-31', 'expense', 'rd', 114200, '2024 R&D Total'),
    ('2024-12-31', 'expense', 'travel', 80400, '2024 Travel Total'),
    ('2024-12-31', 'expense', 'office', 53475, '2024 Office Total'),
    ('2024-12-31', 'expense', 'marketing', 41000, '2024 Marketing Total'),
    ('2024-12-31', 'expense', 'support', 0, '2024 Support Total')
) AS data(date, type, category, amount, description); 