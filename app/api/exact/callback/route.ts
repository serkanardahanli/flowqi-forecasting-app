import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const REDIRECT_URI = process.env.NEXT_PUBLIC_EXACT_REDIRECT_URI || '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const state = requestUrl.searchParams.get('state');
    
    console.log('Received callback with code:', code);
    console.log('Using redirect URI:', REDIRECT_URI);
    
    if (!code) {
      console.error('No code received from Exact Online');
      return NextResponse.redirect(new URL('/settings/exact?error=No+code+received', BASE_URL));
    }

    // Verify state parameter matches what we sent
    if (state !== 'random_state') {
      console.error('Invalid state parameter');
      return NextResponse.redirect(new URL('/settings/exact?error=Invalid+state', BASE_URL));
    }

    // Exchange the code for a token
    const tokenResponse = await fetch('https://start.exactonline.nl/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: process.env.EXACT_CLIENT_ID || '',
        client_secret: process.env.EXACT_CLIENT_SECRET || '',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Error exchanging code for token:', errorData);
      return NextResponse.redirect(new URL('/settings/exact?error=Failed+to+get+token', BASE_URL));
    }

    const tokenData = await tokenResponse.json();
    console.log('Full token data received:', JSON.stringify(tokenData, null, 2));

    // Get user information to create organization
    const userResponse = await fetch('https://start.exactonline.nl/api/v1/current/Me()?$select=CurrentDivision,FullName', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Error getting user info:', errorText);
      return NextResponse.redirect(new URL('/settings/exact?error=Failed+to+get+user+info', BASE_URL));
    }

    let userData;
    try {
      const responseText = await userResponse.text();
      console.log('Raw user response:', responseText);
      userData = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return NextResponse.redirect(new URL('/settings/exact?error=Failed+to+parse+user+info', BASE_URL));
    }

    console.log('User data:', userData);

    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting current user:', userError);
      return NextResponse.redirect(new URL('/settings/exact?error=Not+authenticated', BASE_URL));
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: userData.FullName || 'My Organization',
        created_by: user.id,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return NextResponse.redirect(new URL('/settings/exact?error=Failed+to+create+organization', BASE_URL));
    }

    // Store the token
    const { error: tokenError } = await supabase
      .from('exact_tokens')
      .insert({
        organization_id: org.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: parseInt(tokenData.expires_in),
        token_type: tokenData.token_type,
        division: userData.CurrentDivision || 0,
      });

    if (tokenError) {
      console.error('Error storing token:', tokenError);
      return NextResponse.redirect(new URL('/settings/exact?error=Failed+to+store+token', BASE_URL));
    }

    // Redirect to settings page with success message
    return NextResponse.redirect(new URL('/settings/exact?success=true', BASE_URL));
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.redirect(new URL('/settings/exact?error=Unexpected+error', BASE_URL));
  }
} 