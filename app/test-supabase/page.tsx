'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { supabase } from '@/app/lib/supabase';

export default function TestSupabasePage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testSupabase = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Test 1: Check if we can get the current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session test result:', { sessionData, sessionError });
      
      if (sessionError) {
        throw sessionError;
      }
      
      // Test 2: Try to fetch some data
      const { data, error: queryError } = await supabase
        .from('sync_logs')
        .select('*')
        .limit(1);
      
      console.log('Query test result:', { data, queryError });
      
      if (queryError) {
        throw queryError;
      }
      
      setResult({
        session: sessionData,
        data: data
      });
    } catch (err: any) {
      console.error('Test error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Supabase Test</h1>
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="mb-2">Supabase URL:</p>
              <code className="bg-gray-100 p-2 rounded block">
                {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
              </code>
            </div>
            
            <div>
              <p className="mb-2">Supabase Anon Key:</p>
              <code className="bg-gray-100 p-2 rounded block">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
                  `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 8)}...` : 
                  'Not configured'}
              </code>
            </div>
            
            <Button 
              onClick={testSupabase}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Supabase Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-red-50 p-4 rounded whitespace-pre-wrap">
              {error}
            </pre>
          </CardContent>
        </Card>
      )}
      
      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 