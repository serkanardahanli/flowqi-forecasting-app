-- First drop all existing policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Organization owners can manage their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_users;
DROP POLICY IF EXISTS "Organization owners can manage members" ON organization_users;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view gl_accounts in their organization" ON gl_accounts;
DROP POLICY IF EXISTS "Users can manage gl_accounts in their organization" ON gl_accounts;

-- Create debug view for organizations
CREATE OR REPLACE VIEW my_organizations AS
SELECT o.*
FROM organizations o
JOIN organization_users ou ON ou.organization_id = o.id
WHERE ou.user_id = auth.uid();

-- Simple direct policies for organization_users
CREATE POLICY "Users can view their own organization mappings"
ON organization_users FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own organization mappings"
ON organization_users FOR ALL
USING (user_id = auth.uid());

-- Organizations policies using the view
CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT
USING (
  id IN (SELECT id FROM my_organizations)
);

CREATE POLICY "Organization owners can manage organizations"
ON organizations FOR ALL
USING (
  owner_id = auth.uid()
);

-- Profiles policies
CREATE POLICY "Users can view and manage their own profile"
ON profiles FOR ALL
USING (id = auth.uid());

-- GL accounts policies using the view
CREATE POLICY "Users can view gl_accounts in their organizations"
ON gl_accounts FOR SELECT
USING (
  organization_id IN (SELECT id FROM my_organizations)
);

CREATE POLICY "Users can manage gl_accounts in their organizations"
ON gl_accounts FOR ALL
USING (
  organization_id IN (SELECT id FROM my_organizations)
);

-- Function to automatically create organization for new users
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

-- Make sure the trigger is recreated
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS for organization_users
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Create policies for organization_users
CREATE POLICY "Users can view their own organization memberships" ON organization_users
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage organization memberships" ON organization_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_users
            WHERE user_id = auth.uid()
            AND role = 'owner'
            AND organization_id = organization_users.organization_id
        )
    );

-- Enable RLS for budget_entries
ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for budget_entries
CREATE POLICY "Users can view budget entries in their organization" ON budget_entries
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage budget entries in their organization" ON budget_entries
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    ); 