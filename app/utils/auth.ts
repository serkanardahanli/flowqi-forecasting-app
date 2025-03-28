import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';

/**
 * Helper function to get the organization ID of the current user
 * Handles error cases and provides consistent behavior across components
 */
export async function getOrganizationId(): Promise<string | null> {
  try {
    const supabase = getBrowserSupabaseClient();
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('No active session found:', sessionError?.message || 'User not logged in');
      return null;
    }
    
    // First try: Get the user's profile with organization ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error
    
    if (profile?.organization_id) {
      return profile.organization_id;
    }
    
    // Second try: Check organization_users table
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', session.user.id)
      .limit(1);
      
    if (orgUsersError) {
      console.error('Error getting organization from organization_users:', orgUsersError.message);
    } else if (orgUsers && orgUsers.length > 0) {
      return orgUsers[0].organization_id;
    }
    
    // Third try: Check if user is an organization owner
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', session.user.id)
      .limit(1);
      
    if (orgsError) {
      console.error('Error getting organizations:', orgsError.message);
    } else if (orgs && orgs.length > 0) {
      // Update the profile with the organization ID
      await supabase
        .from('profiles')
        .upsert({ 
          id: session.user.id, 
          organization_id: orgs[0].id 
        });
        
      return orgs[0].id;
    }
    
    console.error('No organization found for user');
    return null;
  } catch (error) {
    console.error('Unexpected error getting organization ID:', error);
    return null;
  }
}

/**
 * Helper function to check if the user is logged in
 * Redirects to the login page if no session is found
 */
export async function checkUserSession(): Promise<boolean> {
  const supabase = createClientComponentClient<Database>();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error checking session:', error);
    return false;
  }
  
  return !!session;
}

/**
 * Create or fix user profile and organization associations
 * This client-side function ensures the user has a complete profile and proper organization access
 */
export async function ensureClientUserProfile(userId: string): Promise<void> {
  try {
    const supabase = getBrowserSupabaseClient();
    
    console.log('Ensuring user profile for user ID:', userId);
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (profileError) {
      console.error('Error checking profile:', profileError.message, profileError);
    }
    
    // Check if user is in any organization
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select('*')
      .eq('user_id', userId);
    
    if (orgUsersError) {
      console.error('Error checking organization users:', orgUsersError.message, orgUsersError);
    }
    
    // Check if user owns any organizations
    const { data: ownedOrgs, error: ownedOrgsError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', userId);
    
    if (ownedOrgsError) {
      console.error('Error checking owned organizations:', ownedOrgsError.message, ownedOrgsError);
    }
    
    // Get user information
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('Error getting user data:', userError?.message, userError);
      throw new Error(userError?.message || 'Could not get user data');
    }
    
    console.log('User data:', userData.user);
    
    let organizationId = null;
    
    // Determine which organization to use
    if (profile?.organization_id) {
      // Use existing profile organization if it exists
      console.log('Using existing profile organization:', profile.organization_id);
      organizationId = profile.organization_id;
    } else if (ownedOrgs && ownedOrgs.length > 0) {
      // Otherwise use the first organization they own
      console.log('Using first owned organization:', ownedOrgs[0].id);
      organizationId = ownedOrgs[0].id;
    } else if (orgUsers && orgUsers.length > 0) {
      // Otherwise use the first organization they're a member of
      console.log('Using first organization membership:', orgUsers[0].organization_id);
      organizationId = orgUsers[0].organization_id;
    } else {
      // Create a new organization if they don't have one
      console.log('Creating new organization for user');
      const { data: newOrg, error: newOrgError } = await supabase
        .from('organizations')
        .insert([{
          name: 'Mijn Organisatie',
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
        
      if (newOrgError) {
        console.error('Error creating organization:', newOrgError.message, newOrgError);
        throw new Error(newOrgError.message || 'Could not create organization');
      }
      
      if (!newOrg || newOrg.length === 0) {
        console.error('Organization was created but no data returned');
        throw new Error('Organization was created but no data returned');
      }
      
      organizationId = newOrg[0].id;
      console.log('New organization created with ID:', organizationId);
    }
    
    // Ensure organization_users association exists
    if (organizationId && (!orgUsers || !orgUsers.find(ou => ou.organization_id === organizationId))) {
      console.log('Creating organization_users association');
      const role = ownedOrgs?.find(o => o.id === organizationId) ? 'owner' : 'member';
      
      const { error: assocError } = await supabase
        .from('organization_users')
        .insert([{
          organization_id: organizationId,
          user_id: userId,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        
      if (assocError) {
        console.error('Error creating organization association:', assocError.message, assocError);
      }
    }
    
    // Create or update profile
    if (!profile) {
      // Create new profile
      console.log('Creating new profile');
      
      if (!organizationId) {
        console.error('Cannot create profile without an organization ID');
        throw new Error('Cannot create profile without an organization ID');
      }
      
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          organization_id: organizationId,
          first_name: userData.user.user_metadata?.first_name || '',
          last_name: userData.user.user_metadata?.last_name || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        
      if (createProfileError) {
        console.error('Error creating profile:', createProfileError.message, createProfileError);
        throw new Error(createProfileError.message || 'Error creating profile');
      }
    } else if (!profile.organization_id && organizationId) {
      // Update existing profile with organization
      console.log('Updating profile with organization ID');
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ 
          organization_id: organizationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (updateProfileError) {
        console.error('Error updating profile:', updateProfileError.message, updateProfileError);
        throw new Error(updateProfileError.message || 'Error updating profile');
      }
    }
    
    console.log('User profile setup complete');
    
  } catch (error) {
    console.error('Error ensuring user profile:', error instanceof Error ? error.message : String(error));
    throw error; // Re-throw to allow calling function to handle the error
  }
} 