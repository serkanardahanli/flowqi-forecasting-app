-- First check if the organization exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = '7eaf94b9-d12e-46d3-95c0-74e9a313a499') THEN
        -- Insert the organization if it doesn't exist
        INSERT INTO organizations (id, name, created_at, updated_at)
        VALUES (
            '7eaf94b9-d12e-46d3-95c0-74e9a313a499', 
            'FlowQi', 
            NOW(), 
            NOW()
        );
    END IF;
END
$$; 