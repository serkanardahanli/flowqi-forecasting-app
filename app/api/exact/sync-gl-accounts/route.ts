import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/app/lib/supabase-server';
import { syncGLAccounts } from '@/lib/exact/gl-accounts';

export async function POST() {
  try {
    const supabase = getServerSupabaseClient();
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get organization ID from user metadata
    const organizationId = session.user.user_metadata.organization_id;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      );
    }
    
    // Start synchronization
    const result = await syncGLAccounts(organizationId);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error syncing GL accounts:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 