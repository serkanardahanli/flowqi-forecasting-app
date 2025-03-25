-- Clear any existing transactions before inserting new ones
DELETE FROM transactions WHERE organization_id = '7eaf94b9-d12e-46d3-95c0-74e9a313a499';

-- Insert test data for transactions with the specific organization ID
INSERT INTO transactions (organization_id, date, year, month, type, category, amount, description) VALUES
  -- Consultancy Revenue 2025
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-01-01', 2025, 1, 'revenue', 'consultancy', 43920, 'Consultancy January'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-02-01', 2025, 2, 'revenue', 'consultancy', 45360, 'Consultancy February'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-03-01', 2025, 3, 'revenue', 'consultancy', 45360, 'Consultancy March'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-04-01', 2025, 4, 'revenue', 'consultancy', 45360, 'Consultancy April'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-05-01', 2025, 5, 'revenue', 'consultancy', 45360, 'Consultancy May'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-06-01', 2025, 6, 'revenue', 'consultancy', 45360, 'Consultancy June'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-07-01', 2025, 7, 'revenue', 'consultancy', 41940, 'Consultancy July'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-08-01', 2025, 8, 'revenue', 'consultancy', 41940, 'Consultancy August'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-09-01', 2025, 9, 'revenue', 'consultancy', 41940, 'Consultancy September'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-10-01', 2025, 10, 'revenue', 'consultancy', 27900, 'Consultancy October'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-11-01', 2025, 11, 'revenue', 'consultancy', 27900, 'Consultancy November'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-12-01', 2025, 12, 'revenue', 'consultancy', 27900, 'Consultancy December'),

  -- SaaS Revenue 2025
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-10-01', 2025, 10, 'revenue', 'saas', 1200, 'SaaS Revenue October'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-11-01', 2025, 11, 'revenue', 'saas', 4798, 'SaaS Revenue November'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-12-01', 2025, 12, 'revenue', 'saas', 9596, 'SaaS Revenue December'),
  
  -- Personnel Expenses 2025
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-01-01', 2025, 1, 'expense', 'personnel', 12500, 'Personnel January'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-02-01', 2025, 2, 'expense', 'personnel', 12500, 'Personnel February'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-03-01', 2025, 3, 'expense', 'personnel', 12500, 'Personnel March'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-04-01', 2025, 4, 'expense', 'personnel', 12500, 'Personnel April'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-05-01', 2025, 5, 'expense', 'personnel', 12500, 'Personnel May'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-06-01', 2025, 6, 'expense', 'personnel', 12500, 'Personnel June'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-07-01', 2025, 7, 'expense', 'personnel', 12500, 'Personnel July'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-08-01', 2025, 8, 'expense', 'personnel', 12500, 'Personnel August'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-09-01', 2025, 9, 'expense', 'personnel', 12500, 'Personnel September'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-10-01', 2025, 10, 'expense', 'personnel', 12500, 'Personnel October'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-11-01', 2025, 11, 'expense', 'personnel', 12500, 'Personnel November'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-12-01', 2025, 12, 'expense', 'personnel', 12500, 'Personnel December'),

  -- R&D Expenses 2025
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-01-01', 2025, 1, 'expense', 'rd', 5600, 'R&D January'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-02-01', 2025, 2, 'expense', 'rd', 5600, 'R&D February'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-03-01', 2025, 3, 'expense', 'rd', 9600, 'R&D March'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-04-01', 2025, 4, 'expense', 'rd', 9600, 'R&D April'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-05-01', 2025, 5, 'expense', 'rd', 9600, 'R&D May'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-06-01', 2025, 6, 'expense', 'rd', 10600, 'R&D June'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-07-01', 2025, 7, 'expense', 'rd', 10600, 'R&D July'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-08-01', 2025, 8, 'expense', 'rd', 10600, 'R&D August'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-09-01', 2025, 9, 'expense', 'rd', 10600, 'R&D September'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-10-01', 2025, 10, 'expense', 'rd', 10600, 'R&D October'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-11-01', 2025, 11, 'expense', 'rd', 10600, 'R&D November'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-12-01', 2025, 12, 'expense', 'rd', 10600, 'R&D December'),

  -- Travel Expenses 2025
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-01-01', 2025, 1, 'expense', 'travel', 6700, 'Travel January'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-02-01', 2025, 2, 'expense', 'travel', 6700, 'Travel February'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-03-01', 2025, 3, 'expense', 'travel', 6700, 'Travel March'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-04-01', 2025, 4, 'expense', 'travel', 6700, 'Travel April'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-05-01', 2025, 5, 'expense', 'travel', 6700, 'Travel May'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-06-01', 2025, 6, 'expense', 'travel', 6700, 'Travel June'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-07-01', 2025, 7, 'expense', 'travel', 6700, 'Travel July'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-08-01', 2025, 8, 'expense', 'travel', 6700, 'Travel August'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-09-01', 2025, 9, 'expense', 'travel', 6700, 'Travel September'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-10-01', 2025, 10, 'expense', 'travel', 6700, 'Travel October'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-11-01', 2025, 11, 'expense', 'travel', 6700, 'Travel November'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-12-01', 2025, 12, 'expense', 'travel', 6700, 'Travel December'),

  -- Office Expenses 2025
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-01-01', 2025, 1, 'expense', 'office', 4520, 'Office January'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-02-01', 2025, 2, 'expense', 'office', 4475, 'Office February'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-03-01', 2025, 3, 'expense', 'office', 4430, 'Office March'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-04-01', 2025, 4, 'expense', 'office', 4412, 'Office April'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-05-01', 2025, 5, 'expense', 'office', 4475, 'Office May'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-06-01', 2025, 6, 'expense', 'office', 4430, 'Office June'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-07-01', 2025, 7, 'expense', 'office', 4520, 'Office July'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-08-01', 2025, 8, 'expense', 'office', 4457, 'Office August'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-09-01', 2025, 9, 'expense', 'office', 4457, 'Office September'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-10-01', 2025, 10, 'expense', 'office', 4430, 'Office October'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-11-01', 2025, 11, 'expense', 'office', 4457, 'Office November'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-12-01', 2025, 12, 'expense', 'office', 4412, 'Office December'),

  -- Marketing Expenses 2025
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-01-01', 2025, 1, 'expense', 'marketing', 3500, 'Marketing January'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-02-01', 2025, 2, 'expense', 'marketing', 3500, 'Marketing February'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-03-01', 2025, 3, 'expense', 'marketing', 3500, 'Marketing March'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-04-01', 2025, 4, 'expense', 'marketing', 3500, 'Marketing April'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-05-01', 2025, 5, 'expense', 'marketing', 3500, 'Marketing May'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-06-01', 2025, 6, 'expense', 'marketing', 2500, 'Marketing June'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-07-01', 2025, 7, 'expense', 'marketing', 3500, 'Marketing July'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-08-01', 2025, 8, 'expense', 'marketing', 3500, 'Marketing August'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-09-01', 2025, 9, 'expense', 'marketing', 3500, 'Marketing September'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-10-01', 2025, 10, 'expense', 'marketing', 3500, 'Marketing October'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-11-01', 2025, 11, 'expense', 'marketing', 3500, 'Marketing November'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2025-12-01', 2025, 12, 'expense', 'marketing', 3500, 'Marketing December'),

  -- Previous year data for comparison (2024)
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2024-12-31', 2024, 12, 'revenue', 'consultancy', 658400, '2024 Consultancy Total'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2024-12-31', 2024, 12, 'revenue', 'saas', 0, '2024 SaaS Total'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2024-12-31', 2024, 12, 'expense', 'personnel', 150000, '2024 Personnel Total'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2024-12-31', 2024, 12, 'expense', 'rd', 114200, '2024 R&D Total'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2024-12-31', 2024, 12, 'expense', 'travel', 80400, '2024 Travel Total'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2024-12-31', 2024, 12, 'expense', 'office', 53475, '2024 Office Total'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2024-12-31', 2024, 12, 'expense', 'marketing', 41000, '2024 Marketing Total'),
  ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', '2024-12-31', 2024, 12, 'expense', 'support', 0, '2024 Support Total'); 