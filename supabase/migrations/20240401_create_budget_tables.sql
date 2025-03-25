-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    full_name TEXT,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create budget_scenarios table
CREATE TABLE IF NOT EXISTS public.budget_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (organization_id, name, year)
);

-- Create budget_income table
CREATE TABLE IF NOT EXISTS public.budget_income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    scenario_id UUID NOT NULL REFERENCES public.budget_scenarios(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    type TEXT NOT NULL,
    client TEXT,
    project TEXT,
    hours INTEGER,
    rate DECIMAL(10,2),
    amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create budget_expenses table
CREATE TABLE IF NOT EXISTS public.budget_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    scenario_id UUID NOT NULL REFERENCES public.budget_scenarios(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    cost_category TEXT NOT NULL,
    sub_category TEXT,
    amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create actual_income table
CREATE TABLE IF NOT EXISTS public.actual_income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    type TEXT NOT NULL,
    client TEXT,
    project TEXT,
    hours INTEGER,
    rate DECIMAL(10,2),
    amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create actual_expenses table
CREATE TABLE IF NOT EXISTS public.actual_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    cost_category TEXT NOT NULL,
    sub_category TEXT,
    amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create budget_kpis table
CREATE TABLE IF NOT EXISTS public.budget_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    scenario_id UUID NOT NULL REFERENCES public.budget_scenarios(id),
    year INTEGER NOT NULL,
    name TEXT NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    actual_value DECIMAL(10,2),
    unit TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actual_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actual_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_kpis ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Create policies for organizations
CREATE POLICY "Users can view their organization" 
    ON public.organizations FOR SELECT 
    USING (id IN (
        SELECT organization_id FROM public.profiles 
        WHERE id = auth.uid()
    ));

-- Create policies for budget_scenarios
CREATE POLICY "Users can view their organization's scenarios" 
    ON public.budget_scenarios FOR SELECT 
    USING (organization_id IN (
        SELECT organization_id FROM public.profiles 
        WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create scenarios for their organization" 
    ON public.budget_scenarios FOR INSERT 
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.profiles 
        WHERE id = auth.uid()
    ));

-- Create policies for budget_income
CREATE POLICY "Users can view their organization's budget income" 
    ON public.budget_income FOR SELECT 
    USING (organization_id IN (
        SELECT organization_id FROM public.profiles 
        WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create budget income for their organization" 
    ON public.budget_income FOR INSERT 
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.profiles 
        WHERE id = auth.uid()
    ));

-- Create policies for budget_expenses
CREATE POLICY "Users can view their organization's budget expenses" 
    ON public.budget_expenses FOR SELECT 
    USING (organization_id IN (
        SELECT organization_id FROM public.profiles 
        WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create budget expenses for their organization" 
    ON public.budget_expenses FOR INSERT 
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.profiles 
        WHERE id = auth.uid()
    ));

-- Create trigger for new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    default_org_id UUID;
BEGIN
    -- Check if there are any organizations
    SELECT id INTO default_org_id FROM public.organizations LIMIT 1;
    
    -- If no organization exists, create a default one
    IF default_org_id IS NULL THEN
        INSERT INTO public.organizations (name)
        VALUES ('Default Organization')
        RETURNING id INTO default_org_id;
    END IF;
    
    -- Create a new profile for the user
    INSERT INTO public.profiles (id, email, organization_id)
    VALUES (NEW.id, NEW.email, default_org_id);
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 