-- Functie om kolommen van een tabel op te halen
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE(column_name text, data_type text, is_nullable text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text, 
    c.data_type::text, 
    c.is_nullable::text
  FROM 
    information_schema.columns c
  WHERE 
    c.table_name = get_table_columns.table_name
  ORDER BY 
    c.ordinal_position;
END;
$$;

-- Functie om RLS-beleid te controleren
CREATE OR REPLACE FUNCTION check_rls_policies(table_name text)
RETURNS TABLE(policy_name text, permissive text, roles text[], cmd text, qual text, with_check text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.policyname::text,
    p.permissive::text,
    p.roles::text[],
    p.cmd::text,
    p.qual::text,
    p.with_check::text
  FROM 
    pg_policies p
  WHERE 
    p.tablename = check_rls_policies.table_name;
END;
$$;

-- Geef alle rechten op de products tabel
GRANT ALL ON products TO authenticated;
GRANT ALL ON products TO anon;
GRANT ALL ON products TO service_role;

-- Geef alle rechten op de gl_accounts tabel
GRANT ALL ON gl_accounts TO authenticated;
GRANT ALL ON gl_accounts TO anon;
GRANT ALL ON gl_accounts TO service_role;

-- Geef uitvoeringsrechten op de nieuwe functies
GRANT EXECUTE ON FUNCTION get_table_columns TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns TO anon;
GRANT EXECUTE ON FUNCTION get_table_columns TO service_role;

GRANT EXECUTE ON FUNCTION check_rls_policies TO authenticated;
GRANT EXECUTE ON FUNCTION check_rls_policies TO anon;
GRANT EXECUTE ON FUNCTION check_rls_policies TO service_role; 