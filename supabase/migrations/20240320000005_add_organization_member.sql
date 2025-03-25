-- Add the current user as an organization member
DO $$
DECLARE
    org_id UUID;
    user_id UUID;
BEGIN
    -- Get the organization ID
    SELECT id INTO org_id FROM organizations LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE EXCEPTION 'No organization found';
    END IF;

    -- Get the current user ID
    SELECT auth.uid() INTO user_id;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user';
    END IF;

    -- Add the user as an admin (only if they don't already exist)
    INSERT INTO organization_members (organization_id, user_id, role, is_owner)
    SELECT org_id, user_id, 'admin', TRUE
    WHERE NOT EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = org_id AND user_id = user_id
    );
    
    -- Output the result
    RAISE NOTICE 'User % added to organization %', user_id, org_id;
END $$; 