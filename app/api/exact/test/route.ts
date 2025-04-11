import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Test the token by making a request to the Exact API
    const response = await fetch('https://start.exactonline.nl/api/v1/current/Me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: 'Token validation failed', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error testing Exact API:', error);
    return NextResponse.json(
      { error: 'Failed to test Exact API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 