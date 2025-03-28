-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_org_id uuid;
BEGIN
    -- Create a new organization for the user
    INSERT INTO organizations (name)
    VALUES (COALESCE(new.raw_user_meta_data->>'full_name', new.email))
    RETURNING id INTO new_org_id;

    -- Add user to the organization as owner
    INSERT INTO organization_users (organization_id, user_id, role)
    VALUES (new_org_id, new.id, 'owner');

    -- Update user's profile
    INSERT INTO profiles (id, email, organization_id, role)
    VALUES (new.id, new.email, new_org_id, 'owner');

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 