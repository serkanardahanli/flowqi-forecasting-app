import { createClient } from '@supabase/supabase-js'

export const createClient = () => {
  console.log('Creating browser Supabase client');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration missing in browser client', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    });
  } else {
    console.log('Browser using Supabase URL:', supabaseUrl);
    console.log('Browser using Supabase key length:', supabaseKey.length);
  }
  
  return createClient(
    supabaseUrl!,
    supabaseKey!
  )
} 