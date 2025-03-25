-- Add the current user as an organization member
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the current user ID
    SELECT auth.uid() INTO user_id;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user';
    END IF;

    -- Add the user as an admin if they don't already exist
    INSERT INTO organization_members (organization_id, user_id, role, is_owner)
    SELECT '3d3d16f9-8eac-4250-a2f1-e49ddf9cc6b8', user_id, 'admin', TRUE
    WHERE NOT EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = '3d3d16f9-8eac-4250-a2f1-e49ddf9cc6b8' AND user_id = user_id
    );
    
    -- Output the result
    RAISE NOTICE 'User % added to organization 3d3d16f9-8eac-4250-a2f1-e49ddf9cc6b8', user_id;
END $$; 