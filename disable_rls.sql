-- SQL bestand om Row Level Security (RLS) uit te schakelen voor alle tabellen

-- Tabellen zonder RLS-beleid hebben
ALTER TABLE IF EXISTS public.gl_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budget_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.saas_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.actual_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.planned_saas_revenue DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.planned_consultancy_revenue DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.forecasts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budget_scenarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses DISABLE ROW LEVEL SECURITY;

-- Geef iedereen toegang tot de data met een algemene policy
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS allow_all ON public.%I;
            CREATE POLICY allow_all ON public.%I
                USING (true)
                WITH CHECK (true);
        ', tbl, tbl);
    END LOOP;
END $$;

-- Schakel RLS uit voor alle tabellen
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', tbl);
    END LOOP;
END $$; 