-- Create a function to get RLS policy information
CREATE OR REPLACE FUNCTION get_table_policies(table_name text)
RETURNS TABLE (
  policyname text,
  permissive text,
  roles text[],
  cmd text,
  qual text,
  with_check text
) 
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
    p.tablename = table_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_table_policies(text) TO authenticated; 