import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }
    
    console.log('Testing connection with token');
    
    const response = await fetch('https://start.exactonline.nl/api/v1/current/Me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API request failed:', errorText);
      return NextResponse.json({ 
        error: 'API request failed', 
        status: response.status,
        details: errorText 
      }, { status: 500 });
    }
    
    const data = await response.json();
    console.log('API request successful');
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error in test-with-token:', error);
    return NextResponse.json({ 
      error: 'Failed to test connection', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 