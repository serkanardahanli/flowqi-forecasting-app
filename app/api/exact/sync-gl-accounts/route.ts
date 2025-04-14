import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getValidToken } from '@/lib/exact/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Create a sync log entry
    const { data: syncLog } = await supabase
      .from('exact_sync_logs')
      .insert({
        sync_type: 'gl_accounts',
        status: 'in_progress',
        start_date: new Date().toISOString()
      })
      .select()
      .single();

    // Get a valid token
    const token = await getValidToken();
    const divisionId = token.division.toString();

    console.log(`Making API request to Exact Online... URL: https://start.exactonline.nl/api/v1/${divisionId}/financial/GLAccounts`);

    // Make the API request to Exact Online
    const response = await fetch(`https://start.exactonline.nl/api/v1/${divisionId}/financial/GLAccounts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Accept': 'application/json'
      }
    });

    console.log(`API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from Exact Online:', errorText);
      
      // Update sync log with error
      await supabase
        .from('exact_sync_logs')
        .update({
          status: 'failed',
          end_date: new Date().toISOString(),
          error_message: `API Error: ${response.status} ${response.statusText}. ${errorText}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);
      
      return NextResponse.json({ error: `Error from Exact Online API: ${response.status} ${response.statusText}` }, { status: 500 });
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.d.results.length} GL accounts`);

    // Get the organization ID
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (!orgData) {
      throw new Error('No organization found');
    }

    // Process each GL account
    let created = 0;
    let updated = 0;

    for (const account of data.d.results) {
      // Check if the account already exists in our database
      const { data: existingAccount } = await supabase
        .from('gl_accounts')
        .select('id')
        .eq('code', account.Code)
        .limit(1)
        .maybeSingle();

      if (existingAccount) {
        // Update existing account
        await supabase
          .from('gl_accounts')
          .update({
            name: account.Description,
            type: account.Type,
            balans_type: account.BalanceSide,
            debet_credit: account.BalanceSide,
            exact_id: account.ID,
            updated_at: new Date().toISOString(),
            last_synced_at: new Date().toISOString()
          })
          .eq('id', existingAccount.id);
        
        updated++;
      } else {
        // Create new account
        await supabase
          .from('gl_accounts')
          .insert({
            code: account.Code,
            name: account.Description,
            type: account.Type,
            balans_type: account.BalanceSide,
            debet_credit: account.BalanceSide,
            exact_id: account.ID,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_synced_at: new Date().toISOString()
          });
        
        created++;
      }
    }

    // Update sync log with success
    await supabase
      .from('exact_sync_logs')
      .update({
        status: 'completed',
        end_date: new Date().toISOString(),
        records_processed: data.d.results.length,
        records_created: created,
        records_updated: updated,
        updated_at: new Date().toISOString()
      })
      .eq('id', syncLog.id);

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${data.d.results.length} GL accounts (${created} created, ${updated} updated)`
    });
  } catch (error: any) {
    console.error('Error synchronizing GL accounts:', error);
    
    // Try to update sync log with error if possible
    try {
      await supabase
        .from('exact_sync_logs')
        .update({
          status: 'failed',
          end_date: new Date().toISOString(),
          error_message: error.message || 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('sync_type', 'gl_accounts')
        .is('end_date', null);
    } catch (logError) {
      console.error('Failed to update sync log:', logError);
    }
    
    return NextResponse.json({ error: error.message || 'Failed to synchronize GL accounts' }, { status: 500 });
  }
} 