-- Drop existing tables if they exist
DROP TABLE IF EXISTS gl_accounts CASCADE;
DROP TABLE IF EXISTS organization_users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_users table
CREATE TABLE organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create gl_accounts table
CREATE TABLE gl_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_code TEXT,
  level INTEGER DEFAULT 1,
  category TEXT,
  type TEXT NOT NULL CHECK (type IN ('Inkomsten', 'Uitgaven', 'Balans')),
  balans_type TEXT NOT NULL CHECK (balans_type IN ('Winst & Verlies', 'Balans')),
  debet_credit TEXT NOT NULL CHECK (debet_credit IN ('Debet', 'Credit')),
  is_blocked BOOLEAN DEFAULT FALSE,
  is_compressed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, code)
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_accounts ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM organization_users WHERE organization_id = organizations.id
      UNION
      SELECT owner_id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can manage their organizations" ON organizations
  FOR ALL USING (owner_id = auth.uid());

-- Organization users policies
CREATE POLICY "Users can view organization members" ON organization_users
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM organization_users WHERE organization_id = organization_users.organization_id
    )
  );

CREATE POLICY "Organization owners can manage members" ON organization_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE id = organization_users.organization_id 
      AND owner_id = auth.uid()
    )
  );

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- GL accounts policies
CREATE POLICY "Users can view gl_accounts in their organization" ON gl_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users 
      WHERE organization_users.user_id = auth.uid() 
      AND organization_users.organization_id = gl_accounts.organization_id
    ) OR EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.owner_id = auth.uid() 
      AND organizations.id = gl_accounts.organization_id
    )
  );

CREATE POLICY "Users can manage gl_accounts in their organization" ON gl_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_users 
      WHERE organization_users.user_id = auth.uid() 
      AND organization_users.organization_id = gl_accounts.organization_id
    ) OR EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.owner_id = auth.uid() 
      AND organizations.id = gl_accounts.organization_id
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a new organization for the user
  INSERT INTO organizations (name, owner_id)
  VALUES ('Nieuwe Organisatie', NEW.id)
  RETURNING id INTO NEW.organization_id;

  -- Create organization_users entry
  INSERT INTO organization_users (organization_id, user_id, role)
  VALUES (NEW.organization_id, NEW.id, 'owner');

  -- Create profile
  INSERT INTO profiles (id, organization_id)
  VALUES (NEW.id, NEW.organization_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 