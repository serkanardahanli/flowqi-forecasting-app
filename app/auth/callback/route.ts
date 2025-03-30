import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    try {
      console.log('Processing auth callback with code');
      
      // Create authenticated Supabase client using the route handler helper
      const supabase = createRouteHandlerClient<Database>({ cookies })
      
      // Exchange the auth code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging auth code for session:', error.message)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, request.url)
        )
      }
      
      // Get the newly created user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting user after auth:', userError?.message)
        return NextResponse.redirect(
          new URL('/auth/signin?error=user_not_found', request.url)
        )
      }
      
      // Ensure the user has a profile
      await ensureUserProfile(supabase, user.id)
      
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (err) {
      console.error('Unexpected error in auth callback:', err)
      return NextResponse.redirect(
        new URL('/auth/signin?error=server_error', request.url)
      )
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    new URL('/auth/signin?error=missing_code', request.url)
  )
}

/**
 * Ensure the user has a profile and is part of an organization
 */
async function ensureUserProfile(supabase: any, userId: string) {
  try {
    console.log('Ensuring user profile for:', userId)
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      
    if (profileError) {
      console.error('Error checking profile:', profileError.message)
    }
      
    // Check if user is in any organization
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select('*')
      .eq('user_id', userId)
      
    if (orgUsersError) {
      console.error('Error checking organization users:', orgUsersError.message)
    }
    
    // If the user already has a profile and is in an organization, we're done
    if (profile && profile.organization_id && orgUsers && orgUsers.length > 0) {
      console.log('User profile and organization already exists')
      return
    }
    
    // Get user information
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Error getting user data:', userError?.message)
      return
    }
    
    // Create organization if needed
    let organizationId = null
    
    // First check if user owns any organizations
    const { data: ownedOrgs, error: ownedOrgsError } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', userId)
      
    if (ownedOrgsError) {
      console.error('Error checking owned organizations:', ownedOrgsError.message)
    }
    
    if (ownedOrgs && ownedOrgs.length > 0) {
      // Use the first organization they own
      organizationId = ownedOrgs[0].id
      console.log('Using existing organization:', organizationId)
    } else {
      console.log('Creating new organization for user')
      // Create a new organization
      const { data: newOrg, error: newOrgError } = await supabase
        .from('organizations')
        .insert([{
          name: 'Mijn Organisatie',
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        
      if (newOrgError) {
        console.error('Error creating organization:', newOrgError.message)
        return
      }
      
      if (newOrg && newOrg.length > 0) {
        organizationId = newOrg[0].id
        console.log('New organization created:', organizationId)
      } else {
        console.error('Failed to create organization: No data returned')
        return
      }
    }
    
    // Ensure user is associated with the organization
    if (organizationId && (!orgUsers || orgUsers.length === 0)) {
      console.log('Creating organization user association')
      const { error: orgUserError } = await supabase
        .from('organization_users')
        .insert([{
          organization_id: organizationId,
          user_id: userId,
          role: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        
      if (orgUserError) {
        console.error('Error creating organization user association:', orgUserError.message)
      }
    }
    
    // Create or update profile with organization
    if (!profile) {
      console.log('Creating new user profile')
      const { error: profileInsertError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          organization_id: organizationId,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        
      if (profileInsertError) {
        console.error('Error creating profile:', profileInsertError.message)
      }
    } else if (!profile.organization_id && organizationId) {
      console.log('Updating existing profile with organization')
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ 
          organization_id: organizationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        
      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError.message)
      }
    }
    
    console.log('User profile setup complete')
  } catch (error) {
    console.error('Error ensuring user profile:', error instanceof Error ? error.message : String(error))
  }
} 