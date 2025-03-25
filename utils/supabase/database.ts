import { createClient as createServerClient } from './server'
import { createClient as createBrowserClient } from './client'

export async function getUserOrganization(userId: string) {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user organization:', error)
    return null
  }
  
  if (!data.organization_id) {
    return null
  }
  
  const { data: organizationData, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', data.organization_id)
    .single()
  
  if (orgError) {
    console.error('Error fetching organization:', orgError)
    return null
  }
  
  return {
    ...organizationData,
    userRole: data.role
  }
}

export async function createOrganization(name: string, userId: string) {
  const supabase = createServerClient()
  
  // Create the organization
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      owner_id: userId
    })
    .select()
    .single()
  
  if (orgError) {
    console.error('Error creating organization:', orgError)
    return { error: orgError.message }
  }
  
  // Update the user's profile with the new organization ID and set role to admin
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      organization_id: orgData.id,
      role: 'admin'
    })
    .eq('id', userId)
  
  if (profileError) {
    console.error('Error updating user profile:', profileError)
    return { error: profileError.message }
  }
  
  return { success: true, organization: orgData }
}

export async function getTeamMembers(organizationId: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)
  
  if (error) {
    console.error('Error fetching team members:', error)
    return { error: error.message }
  }
  
  return { data }
}

export async function inviteTeamMember(email: string, role: string, organizationId: string) {
  // In a real application, this would send an email with a signup link
  // For now, we'll simulate it
  
  // Here you would normally implement your email sending logic
  // and create a pending invitation in the database
  
  return { success: true, message: `Invitation sent to ${email} with role ${role}` }
} 