-- Update de check constraint voor niveau in gl_accounts
ALTER TABLE gl_accounts DROP CONSTRAINT IF EXISTS gl_accounts_level_check;
ALTER TABLE gl_accounts ADD CONSTRAINT gl_accounts_level_check CHECK (level IN (1, 2, 3));

-- Optioneel: voeg een comment toe aan de kolom voor duidelijkheid
COMMENT ON COLUMN gl_accounts.level IS 'Niveau van de grootboekrekening: 1=Hoofdgroep, 2=Subgroep, 3=Kostenpost';

-- Update de RLS policies om zeker te zijn dat ze goed werken voor alle niveaus
DROP POLICY IF EXISTS "Users can view gl_accounts they own" ON gl_accounts;
DROP POLICY IF EXISTS "Users can insert gl_accounts they own" ON gl_accounts;
DROP POLICY IF EXISTS "Users can update gl_accounts they own" ON gl_accounts;
DROP POLICY IF EXISTS "Users can delete gl_accounts they own" ON gl_accounts;

-- Maak de policies opnieuw aan
CREATE POLICY "Users can view gl_accounts they own"
ON gl_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = gl_accounts.organization_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert gl_accounts they own"
ON gl_accounts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = gl_accounts.organization_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update gl_accounts they own"
ON gl_accounts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = gl_accounts.organization_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete gl_accounts they own"
ON gl_accounts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = gl_accounts.organization_id
    AND owner_id = auth.uid()
  )
); 