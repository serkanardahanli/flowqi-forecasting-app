/**
 * Utility functions for Exact Online API integration
 */

const EXACT_CLIENT_ID = '4b311ef8-c54e-479d-8dc0-855d2627c462';
const EXACT_CLIENT_SECRET = process.env.EXACT_CLIENT_SECRET || '';
const EXACT_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/exact/callback`;

/**
 * Exchange authorization code for access token
 */
export async function getExactToken(code: string) {
  try {
    const response = await fetch('https://start.exactonline.nl/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: EXACT_REDIRECT_URI,
        client_id: EXACT_CLIENT_ID,
        client_secret: EXACT_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error exchanging code for token:', errorText);
      throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getExactToken:', error);
    throw error;
  }
}

/**
 * Make an authenticated request to the Exact API
 */
export async function exactApiRequest(endpoint: string, token: string) {
  try {
    const response = await fetch(`https://start.exactonline.nl/api/v1/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching ${endpoint}:`, errorText);
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error in exactApiRequest for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get GL accounts from Exact
 */
export async function getGLAccounts(token: string) {
  return exactApiRequest('financial/GLAccounts', token);
} 