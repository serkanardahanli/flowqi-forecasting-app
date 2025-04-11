import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import { exactClient } from './client';

const supabase = getBrowserSupabaseClient();

export async function syncGLAccounts(organizationId: string) {
  // Create a sync log
  const { data: syncLog } = await supabase
    .from('exact_sync_logs')
    .insert({
      sync_type: 'gl_accounts',
      status: 'processing',
      organization_id: organizationId
    })
    .select();
    
  const syncLogId = syncLog![0].id;
  
  try {
    // Fetch GL accounts
    const accounts = await exactClient.getGLAccounts();
    
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    
    // Process each account
    for (const account of accounts) {
      recordsProcessed++;
      
      try {
        // Determine the type
        let accountType = 'other';
        if (account.Code.startsWith('8')) accountType = 'income';
        if (account.Code.startsWith('4')) accountType = 'expense';
        
        // Check if it already exists
        const { data: existing } = await supabase
          .from('gl_accounts')
          .select('id')
          .eq('exact_id', account.ID)
          .eq('organization_id', organizationId)
          .limit(1);
        
        if (existing && existing.length > 0) {
          // Update existing
          await supabase
            .from('gl_accounts')
            .update({
              code: account.Code,
              description: account.Description,
              type: accountType,
              last_synced: new Date().toISOString()
            })
            .eq('id', existing[0].id);
          
          recordsUpdated++;
        } else {
          // Create new
          await supabase
            .from('gl_accounts')
            .insert({
              code: account.Code,
              description: account.Description,
              type: accountType,
              exact_id: account.ID,
              organization_id: organizationId,
              last_synced: new Date().toISOString()
            });
          
          recordsCreated++;
        }
      } catch (error) {
        recordsFailed++;
        console.error('Error processing account:', error);
      }
    }
    
    // Update sync log
    await supabase
      .from('exact_sync_logs')
      .update({
        status: 'completed',
        records_processed: recordsProcessed,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        records_failed: recordsFailed
      })
      .eq('id', syncLogId);
    
    return {
      success: true,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsFailed
    };
  } catch (error: any) {
    // Update sync log on error
    await supabase
      .from('exact_sync_logs')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', syncLogId);
    
    throw error;
  }
} 