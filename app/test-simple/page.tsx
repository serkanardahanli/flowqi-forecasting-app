'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';

export default function TestSimplePage() {
  const [result, setResult] = useState('Nog niet getest');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testSupabase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Testing Supabase connection...');

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
      
      setResult(`Tests geslaagd!\n\nSession: ${JSON.stringify(sessionData, null, 2)}\n\nData: ${JSON.stringify(data, null, 2)}`);
    } catch (err: any) {
      console.error('Test error:', err);
      setError(err.message || 'Onbekende fout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-black">Eenvoudige Supabase Test</h1>
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-black">Test Configuratie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-black mb-2">Supabase URL:</p>
              <code className="bg-gray-100 p-2 rounded block text-black">
                {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Niet geconfigureerd'}
              </code>
            </div>

            <div>
              <p className="text-black mb-2">Supabase Anon Key:</p>
              <code className="bg-gray-100 p-2 rounded block text-black">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
                  `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 8)}...` : 
                  'Niet geconfigureerd'}
              </code>
            </div>

            <Button 
              onClick={testSupabase}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 border border-gray-200"
              variant="outline"
            >
              <span className="text-black">
                {isLoading ? 'Bezig met testen...' : 'Test Supabase Verbinding'}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-black">Fout</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-red-50 p-4 rounded text-black whitespace-pre-wrap">
              {error}
            </pre>
          </CardContent>
        </Card>
      )}
      
      {result !== 'Nog niet getest' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-black">Resultaat</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded text-black whitespace-pre-wrap">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 