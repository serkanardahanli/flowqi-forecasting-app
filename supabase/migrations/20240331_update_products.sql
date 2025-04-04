-- Eerst de grootboekrekeningen aanmaken als ze nog niet bestaan
INSERT INTO gl_accounts (code, name, type, level, category, balans_type, debet_credit, is_blocked, is_compressed)
VALUES 
    ('8000', 'Omzet', 'Inkomsten', 1, 'Omzet', 'Winst & Verlies', 'Credit', false, false),
    ('8010', 'Omzet Consultancy', 'Inkomsten', 2, 'Omzet', 'Winst & Verlies', 'Credit', false, false),
    ('8020', 'Omzet SaaS', 'Inkomsten', 2, 'Omzet', 'Winst & Verlies', 'Credit', false, false),
    ('8021', 'Omzet Basic Subscription', 'Inkomsten', 3, 'Omzet', 'Winst & Verlies', 'Credit', false, false),
    ('8022', 'Omzet Sales Tool', 'Inkomsten', 3, 'Omzet', 'Winst & Verlies', 'Credit', false, false)
ON CONFLICT (code) DO NOTHING;

-- Maak de gl_account_id optioneel
ALTER TABLE products 
ALTER COLUMN gl_account_id DROP NOT NULL;

-- Update bestaande producten met standaard grootboekrekeningen
UPDATE products 
SET gl_account_id = (
    SELECT id 
    FROM gl_accounts 
    WHERE code = CASE 
        WHEN type = 'consultancy' THEN '8010'  -- Consultancy producten
        WHEN type = 'saas' THEN '8020'         -- SaaS producten
    END
    LIMIT 1
)
WHERE gl_account_id IS NULL; 