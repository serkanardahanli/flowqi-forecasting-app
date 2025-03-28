import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database } from '@/types/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.session) {
      await ensureUserProfile(supabase, data.session.user.id)
    }
    
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(new URL('/auth/signin', request.url))
}

/**
 * Ensure the user has a profile and is part of an organization
 */
async function ensureUserProfile(supabase: any, userId: string) {
  try {
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      
    // Check if user is in any organization
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select('*')
      .eq('user_id', userId)
      
    // If the user already has a profile and is in an organization, we're done
    if (profile && profile.organization_id && orgUsers && orgUsers.length > 0) {
      return
    }
    
    // Get user information
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Error getting user data:', userError)
      return
    }
    
    // Create organization if needed
    let organizationId = null
    
    // Check if user owns any organizations
    const { data: ownedOrgs, error: ownedOrgsError } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', userId)
      
    if (ownedOrgs && ownedOrgs.length > 0) {
      // Use the first organization they own
      organizationId = ownedOrgs[0].id
    } else {
      // Create a new organization
      const { data: newOrg, error: newOrgError } = await supabase
        .from('organizations')
        .insert([{
          name: 'Mijn Organisatie',
          owner_id: userId
        }])
        .select()
        
      if (newOrgError) {
        console.error('Error creating organization:', newOrgError)
        return
      }
      
      organizationId = newOrg[0].id
    }
    
    // Ensure user is associated with the organization
    if (organizationId && (!orgUsers || orgUsers.length === 0)) {
      await supabase
        .from('organization_users')
        .insert([{
          organization_id: organizationId,
          user_id: userId,
          role: 'owner'
        }])
    }
    
    // Create or update profile with organization
    if (!profile) {
      await supabase
        .from('profiles')
        .insert([{
          id: userId,
          organization_id: organizationId,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || ''
        }])
    } else if (!profile.organization_id && organizationId) {
      await supabase
        .from('profiles')
        .update({ organization_id: organizationId })
        .eq('id', userId)
    }
    
  } catch (error) {
    console.error('Error ensuring user profile:', error)
  }
} 