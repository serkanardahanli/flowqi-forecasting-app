-- Add the current user as organization member if not already a member
-- This uses email matching instead of auth.uid() since we're running in SQL Editor
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get the user ID by email (replace with actual user's email)
    SELECT id INTO user_uuid FROM auth.users WHERE email = 's.ardahanli@flowqi.com';

    -- Check if user is already a member of the organization
    IF NOT EXISTS (
        SELECT 1 FROM organization_members 
        WHERE user_id = user_uuid 
        AND organization_id = '7eaf94b9-d12e-46d3-95c0-74e9a313a499'
    ) THEN
        -- Insert the user as an admin of the organization
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES ('7eaf94b9-d12e-46d3-95c0-74e9a313a499', user_uuid, 'admin');
    END IF;
END $$; 