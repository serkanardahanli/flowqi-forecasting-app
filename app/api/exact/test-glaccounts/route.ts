import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/app/lib/supabase-server';
import { exactClient } from '@/lib/exact/client';

export async function GET() {
  try {
    const supabase = getServerSupabaseClient();
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Niet ingelogd in Supabase' },
        { status: 401 }
      );
    }

    // Haal huidige divisie op
    const meResponse = await exactClient.request('current/Me?$select=CurrentDivision');
    const currentDivision = meResponse?.d?.results?.[0]?.CurrentDivision;
    
    if (!currentDivision) {
      throw new Error('Geen toegang tot Exact divisie');
    }

    // Haal grootboekrekeningen op met uitgebreide informatie
    const glAccountsResponse = await exactClient.request(
      `${currentDivision}/financial/GLAccounts?$select=ID,Code,Description,Type,AssimilatedVATBox,BalanceSide,BalanceType,BelcotaxType,Blocked,Compress,CostCenter,CostUnit,UseCostCenter,UseCostUnit&$top=50`
    );

    const glAccounts = glAccountsResponse?.d?.results;

    if (!glAccounts) {
      throw new Error('Geen grootboekrekeningen gevonden of geen toegang tot grootboekrekeningen');
    }

    // Extra statistieken berekenen
    const statistics = {
      total: glAccounts.length,
      byType: glAccounts.reduce((acc: any, account: any) => {
        acc[account.Type] = (acc[account.Type] || 0) + 1;
        return acc;
      }, {}),
      blocked: glAccounts.filter((account: any) => account.Blocked).length,
      useCostCenter: glAccounts.filter((account: any) => account.UseCostCenter).length,
      useCostUnit: glAccounts.filter((account: any) => account.UseCostUnit).length
    };

    return NextResponse.json({
      status: 'success',
      message: `Succesvol ${glAccounts.length} grootboekrekeningen opgehaald`,
      data: {
        accounts: glAccounts,
        statistics,
        division: currentDivision,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Fout bij ophalen grootboekrekeningen:', error);
    
    let errorMessage = 'Onbekende fout bij ophalen grootboekrekeningen';
    let errorDetails = null;

    if (error.response?.data) {
      errorDetails = error.response.data;
      if (error.response.status === 401) {
        errorMessage = 'Token verlopen of ongeldig. Probeer opnieuw in te loggen bij Exact Online.';
      } else if (error.response.status === 403) {
        errorMessage = 'Geen toegang tot grootboekrekeningen. Controleer de machtigingen.';
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