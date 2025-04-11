import { NextResponse } from 'next/server';
import { syncTransactions } from '@/lib/exact/transactions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startDate, endDate } = body;
    
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    }
    
    const result = await syncTransactions(startDate, endDate);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 