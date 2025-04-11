import { getBrowserSupabaseClient } from '@/app/lib/supabase';

const supabase = getBrowserSupabaseClient();

interface ExactToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  division: number;
}

async function getValidToken(): Promise<ExactToken> {
  // Get the current token from the database
  const { data: tokenData, error } = await supabase
    .from('exact_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !tokenData) {
    throw new Error('No Exact Online token found. Please authenticate first.');
  }

  // Check if token needs refresh
  const tokenAge = Date.now() - new Date(tokenData.created_at).getTime();
  const tokenExpired = tokenAge > (tokenData.expires_in * 1000);

  if (tokenExpired) {
    return refreshToken(tokenData.refresh_token);
  }

  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in,
    token_type: tokenData.token_type,
    division: tokenData.division
  };
}

async function refreshToken(refreshToken: string): Promise<ExactToken> {
  const response = await fetch('https://start.exactonline.nl/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.EXACT_CLIENT_ID!,
      client_secret: process.env.EXACT_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Exact Online token');
  }

  const token = await response.json();

  // Store the new token in the database
  await supabase.from('exact_tokens').insert({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_in: token.expires_in,
    token_type: token.token_type,
    division: token.division,
    created_at: new Date().toISOString(),
  });

  return token;
}

export class ExactClient {
  private baseUrl = 'https://start.exactonline.nl/api/v1';
  
  async request(endpoint: string, options: RequestInit = {}) {
    const token = await getValidToken();
    
    const url = `${this.baseUrl}/${token.division}/${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${token.access_token}`,
      'Accept': 'application/json',
      ...options.headers
    };
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Exact API error: ${response.status} - ${await response.text()}`);
    }
    
    return response.json();
  }
  
  async getGLAccounts() {
    const data = await this.request(
      'financial/GLAccounts?$select=ID,Code,Description,Type&$filter=Type eq \'Balance Sheet\' or Type eq \'Profit & Loss\''
    );
    return data.d.results;
  }
  
  async getTransactions(startDate: string, endDate: string) {
    const data = await this.request(
      `financialtransaction/Transactions?$select=ID,EntryDate,EntryNumber,Description,AmountFC,GLAccount,GLAccountCode,GLAccountDescription&$filter=EntryDate ge datetime'${startDate}' and EntryDate le datetime'${endDate}'`
    );
    return data.d.results;
  }
}

export const exactClient = new ExactClient(); 