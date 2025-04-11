import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }
    
    console.log('Received authorization code:', code);
    
    // Use the exact ngrok URL as configured in Exact Online
    const redirectUri = 'https://broadly-happy-escargot.ngrok-free.app/api/exact/callback';
    
    // Exchange code for token
    const tokenResponse = await fetch('https://start.exactonline.nl/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': '4b311ef8-c54e-479d-8dc0-855d2627c462',
        'client_secret': process.env.EXACT_CLIENT_SECRET || '',
        'redirect_uri': redirectUri,
      }).toString()
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Error exchanging code for token:', errorText);
      return NextResponse.json({ 
        error: 'Failed to exchange code for token', 
        details: errorText 
      }, { status: 500 });
    }
    
    const tokenData = await tokenResponse.json();
    console.log('Successfully obtained token');
    
    // Redirect to the test page with the token
    const redirectUrl = `https://broadly-happy-escargot.ngrok-free.app/settings/exact/test?token=${encodeURIComponent(tokenData.access_token)}`;
    
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Error in callback:', error);
    return NextResponse.json({ 
      error: 'Failed to process authorization', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 