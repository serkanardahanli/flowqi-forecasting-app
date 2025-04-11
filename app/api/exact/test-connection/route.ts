import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/app/lib/supabase-server';
import { exactClient } from '@/lib/exact/client';

export async function GET() {
  try {
    console.log('Start: Test connection to Exact Online API');
    const supabase = getServerSupabaseClient();
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('Error: No Supabase session found');
      return NextResponse.json(
        { error: 'Niet ingelogd in Supabase' },
        { status: 401 }
      );
    }
    console.log('Supabase authentication successful');

    // Test 1: Basis API verbinding - Me endpoint
    console.log('Testing Me endpoint...');
    try {
      const meResponse = await exactClient.request('current/Me');
      console.log('Me endpoint response:', {
        status: meResponse?.status,
        hasResults: Boolean(meResponse?.d?.results?.length),
        firstResult: meResponse?.d?.results?.[0]
      });
      
      if (!meResponse?.d?.results?.[0]) {
        throw new Error('Geen toegang tot Exact Online API - Me endpoint niet bereikbaar');
      }

      const userData = meResponse.d.results[0];
      console.log('Successfully retrieved user data:', {
        fullName: userData.FullName,
        email: userData.Email,
        division: userData.CurrentDivision
      });
    } catch (meError: any) {
      console.error('Error accessing Me endpoint:', {
        error: meError.message,
        response: meError.response?.data,
        status: meError.response?.status
      });
      throw meError;
    }
    
    // Test 2: Check huidige divisie
    const currentDivision = userData.CurrentDivision;
    if (!currentDivision) {
      console.error('No division found in user data');
      throw new Error('Geen toegang tot Exact divisie');
    }
    console.log('Current division:', currentDivision);

    // Test 3: Divisie details ophalen
    console.log('Fetching division details...');
    try {
      const divisionResponse = await exactClient.request(
        `system/Divisions?$filter=Code eq ${currentDivision}&$select=Code,Description,Customer,CustomerCode`
      );
      console.log('Division details response:', {
        status: divisionResponse?.status,
        hasResults: Boolean(divisionResponse?.d?.results?.length),
        details: divisionResponse?.d?.results?.[0]
      });
      const divisionDetails = divisionResponse?.d?.results?.[0];
    } catch (divError: any) {
      console.error('Error fetching division details:', {
        error: divError.message,
        response: divError.response?.data,
        status: divError.response?.status
      });
      throw divError;
    }

    // Test 4: Check API versie en endpoints
    console.log('Checking API info...');
    try {
      const apiInfoResponse = await exactClient.request('system/ApiInfo');
      console.log('API info response:', {
        status: apiInfoResponse?.status,
        hasResults: Boolean(apiInfoResponse?.d?.results?.length),
        info: apiInfoResponse?.d?.results?.[0]
      });
      const apiInfo = apiInfoResponse?.d?.results?.[0];
    } catch (apiError: any) {
      console.error('Error fetching API info:', {
        error: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status
      });
      throw apiError;
    }

    console.log('All tests completed successfully');
    return NextResponse.json({
      status: 'success',
      message: 'Succesvol verbonden met Exact Online API',
      connection_details: {
        user: {
          fullName: userData.FullName,
          email: userData.Email,
          userCode: userData.UserCode,
        },
        division: {
          code: currentDivision,
          details: divisionDetails
        },
        api: {
          version: apiInfo?.ApiVersion,
          endpoints: apiInfo?.ApiEndpoints
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Final error in test connection:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    
    let errorMessage = 'Onbekende fout bij verbinden met Exact Online';
    let errorDetails = null;

    if (error.response?.data) {
      errorDetails = error.response.data;
      if (error.response.status === 401) {
        errorMessage = 'Token verlopen of ongeldig. Probeer opnieuw in te loggen bij Exact Online.';
      } else if (error.response.status === 403) {
        errorMessage = 'Geen toegang tot deze Exact Online functionaliteit. Controleer de machtigingen.';
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        status: 'error',
        error: errorMessage,
        details: errorDetails
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    
    // Test API call
    const response = await fetch('https://start.exactonline.nl/api/v1/current/Me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'API call failed', 
        status: response.status,
        body: await response.text()
      }, { status: 500 });
    }
    
    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 