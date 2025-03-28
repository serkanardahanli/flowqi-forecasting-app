-- Drop existing tables if they exist
DROP TABLE IF EXISTS budget_entries CASCADE;
DROP TABLE IF EXISTS gl_accounts CASCADE;
DROP TABLE IF EXISTS organization_users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create organization_users table
CREATE TABLE organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(organization_id, user_id)
);

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create gl_accounts table
CREATE TABLE gl_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    parent_code TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    category TEXT,
    type TEXT NOT NULL CHECK (type IN ('Inkomsten', 'Uitgaven', 'Balans')),
    balans_type TEXT NOT NULL CHECK (balans_type IN ('Winst & Verlies', 'Balans')),
    debet_credit TEXT NOT NULL CHECK (debet_credit IN ('Debet', 'Credit')),
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    is_compressed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(organization_id, code)
);

-- Create budget_entries table
CREATE TABLE budget_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gl_account_id UUID NOT NULL REFERENCES gl_accounts(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(organization_id, gl_account_id, year, month)
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their organization"
    ON organizations
    FOR SELECT
    USING (
        id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their organization memberships"
    ON organization_users
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    USING (id = auth.uid() OR EXISTS (
        SELECT 1 FROM organization_users
        WHERE organization_users.organization_id = profiles.organization_id
        AND organization_users.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own profile"
    ON profiles
    FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view GL accounts in their organization"
    ON gl_accounts
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert GL accounts in their organization"
    ON gl_accounts
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update GL accounts in their organization"
    ON gl_accounts
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete GL accounts in their organization"
    ON gl_accounts
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view budget entries in their organization"
    ON budget_entries
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert budget entries in their organization"
    ON budget_entries
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update budget entries in their organization"
    ON budget_entries
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete budget entries in their organization"
    ON budget_entries
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Create a new organization for the user
    INSERT INTO organizations (name)
    VALUES (NEW.email)
    RETURNING id INTO new_org_id;

    -- Add the user as an owner of the organization
    INSERT INTO organization_users (organization_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');

    -- Create a profile for the user
    INSERT INTO profiles (id, organization_id)
    VALUES (NEW.id, new_org_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 