-- Eerst alle bestaande policies verwijderen
DROP POLICY IF EXISTS "Users can view their own organization mappings" ON organization_users;
DROP POLICY IF EXISTS "Users can manage their own organization mappings" ON organization_users;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Organization owners can manage organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view and manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view gl_accounts in their organizations" ON gl_accounts;
DROP POLICY IF EXISTS "Users can manage gl_accounts in their organizations" ON gl_accounts;
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON organization_users;
DROP POLICY IF EXISTS "Users can manage organization memberships" ON organization_users;
DROP POLICY IF EXISTS "Users can view budget entries in their organization" ON budget_entries;
DROP POLICY IF EXISTS "Users can manage budget entries in their organization" ON budget_entries;

-- Verwijder de view als deze bestaat
DROP VIEW IF EXISTS my_organizations;

-- Verander de aanpak: gebruik directe, simpele policies zonder verwijzingen naar andere tabellen

-- Organizations policies
CREATE POLICY "Users can view their owned organizations"
ON organizations
FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Organization owners can manage their organizations"
ON organizations
FOR ALL
USING (owner_id = auth.uid());

-- Zeer eenvoudige organization_users policies
CREATE POLICY "Users can select their own memberships"
ON organization_users
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Organization owners can insert memberships"
ON organization_users
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM organizations
  WHERE id = organization_users.organization_id
  AND owner_id = auth.uid()
));

CREATE POLICY "Organization owners can delete memberships"
ON organization_users
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM organizations
  WHERE id = organization_users.organization_id
  AND owner_id = auth.uid()
));

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can manage their own profile"
ON profiles
FOR UPDATE
USING (id = auth.uid());

-- GL accounts policies
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

-- Budget entries policies
CREATE POLICY "Users can view budget entries they own"
ON budget_entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = budget_entries.organization_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert budget entries they own"
ON budget_entries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = budget_entries.organization_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update budget entries they own"
ON budget_entries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = budget_entries.organization_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete budget entries they own"
ON budget_entries
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organizations
    WHERE id = budget_entries.organization_id
    AND owner_id = auth.uid()
  )
);

-- Function om nieuwe gebruikers te koppelen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new organization
  INSERT INTO organizations (name, owner_id)
  VALUES ('Nieuwe Organisatie', NEW.id)
  RETURNING id INTO new_org_id;

  -- Create organization_users entry
  INSERT INTO organization_users (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  -- Create profile
  INSERT INTO profiles (id, organization_id)
  VALUES (NEW.id, new_org_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger opnieuw aanmaken
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 