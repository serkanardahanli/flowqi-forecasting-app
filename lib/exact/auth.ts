import { createClient } from '@supabase/supabase-js';

interface ExactToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  division: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getValidToken(): Promise<ExactToken> {
  // Get the current token from the database
  const { data: tokenData } = await supabase
    .from('exact_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!tokenData) {
    throw new Error('No Exact Online token found. Please authenticate first.');
  }

  // Check if token is expired based on expires_at field
  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);
  
  // Refresh token if it expires in less than 5 minutes
  const tokenNeedsRefresh = expiresAt < new Date(now.getTime() + 5 * 60 * 1000);

  if (tokenNeedsRefresh) {
    console.log('Token expires soon, refreshing...');
    return refreshToken(tokenData);
  }

  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in || 0,
    token_type: tokenData.token_type || 'bearer',
    division: parseInt(tokenData.division)
  };
}

async function refreshToken(tokenData: any): Promise<ExactToken> {
  console.log('Refreshing Exact Online token...');
  
  try {
    const response = await fetch('https://start.exactonline.nl/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
        client_id: process.env.EXACT_CLIENT_ID!,
        client_secret: process.env.EXACT_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error refreshing token:', errorText);
      throw new Error(`Failed to refresh Exact Online token: ${response.status} ${response.statusText}`);
    }

    const token = await response.json();
    console.log('Token refreshed successfully');

    // Calculate new expiration date
    const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();
    
    // Preserve the division from the existing token if not provided in the refresh response
    const division = token.division || tokenData.division;

    // Update the existing token in the database
    const { error } = await supabase
      .from('exact_tokens')
      .update({
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: expiresAt,
        expires_in: token.expires_in,
        token_type: token.token_type,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenData.id);

    if (error) {
      console.error('Error updating token in database:', error);
    }

    return {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_in: token.expires_in,
      token_type: token.token_type,
      division: division
    };
  } catch (error) {
    console.error('Error in refreshToken:', error);
    throw error;
  }
} 