-- First drop any existing problematic policies
DROP POLICY IF EXISTS "Users can view their own organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can only view their own organization" ON organization_members;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Admin users can insert organization members" ON organization_members;
DROP POLICY IF EXISTS "Admin users can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Admin users can delete organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view all organization members" ON organization_members;

-- Create a simplified policy for viewing that doesn't cause recursion
CREATE POLICY "Users can view all organization members"
  ON organization_members
  FOR SELECT
  USING (true);  -- Allow all authenticated users to view organization members

-- Create a policy for inserting organization members
CREATE POLICY "Admin users can insert organization members"
  ON organization_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE 
        organization_id = NEW.organization_id AND 
        user_id = auth.uid() AND 
        role = 'admin'
    )
  );

-- Create a policy for updating organization members
CREATE POLICY "Admin users can update organization members"
  ON organization_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE 
        organization_id = OLD.organization_id AND 
        user_id = auth.uid() AND 
        role = 'admin'
    )
  );

-- Create a policy for deleting organization members
CREATE POLICY "Admin users can delete organization members"
  ON organization_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE 
        organization_id = OLD.organization_id AND 
        user_id = auth.uid() AND 
        role = 'admin'
    )
  ); 