-- Fix for the infinite recursion in the policy for relation "organization_members"
-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Organization members can view organizations they are a member of" ON organizations;
DROP POLICY IF EXISTS "Organization members can view their own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organizations;
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can view members in their organization" ON organization_members;

-- Create a simplified policy for viewing organizations
CREATE POLICY "Users can view organizations they are members of" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Create a simplified policy for viewing organization memberships
CREATE POLICY "Users can view their own organization memberships" ON organization_members
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Create a simplified policy for viewing all members in an organization
CREATE POLICY "Users can view members in their organization" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  ); 