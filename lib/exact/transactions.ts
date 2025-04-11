import { createClient } from '@supabase/supabase-js';
import { exactClient } from './client';

export async function syncTransactions(startDate: string, endDate: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Create a sync log
  const { data: syncLog } = await supabase
    .from('exact_sync_logs')
    .insert({
      sync_type: 'transactions',
      status: 'processing',
      start_date: startDate,
      end_date: endDate
    })
    .select();
    
  const syncLogId = syncLog![0].id;
  
  try {
    // Fetch transactions
    const transactions = await exactClient.getTransactions(startDate, endDate);
    
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    
    // Process each transaction
    for (const transaction of transactions) {
      recordsProcessed++;
      
      try {
        // Check if it already exists
        const { data: existing } = await supabase
          .from('actual_entries')
          .select('id')
          .eq('exact_id', transaction.ID)
          .limit(1);
        
        const entryData = {
          date: transaction.EntryDate,
          description: transaction.Description,
          amount: Math.abs(transaction.AmountFC),
          gl_account_code: transaction.GLAccountCode,
          gl_account_description: transaction.GLAccountDescription,
          is_expense: transaction.AmountFC < 0,
          exact_id: transaction.ID,
          entry_number: transaction.EntryNumber,
          last_synced: new Date().toISOString()
        };
        
        if (existing && existing.length > 0) {
          // Update existing
          await supabase
            .from('actual_entries')
            .update(entryData)
            .eq('id', existing[0].id);
          
          recordsUpdated++;
        } else {
          // Create new
          await supabase
            .from('actual_entries')
            .insert(entryData);
          
          recordsCreated++;
        }
      } catch (error) {
        recordsFailed++;
        console.error('Error processing transaction:', error);
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