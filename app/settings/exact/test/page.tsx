'use client';

import { ExactLoginButton } from '../login-button';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ExactTestPage() {
  const [token, setToken] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  
  // Check for token in URL (from OAuth callback)
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // Automatically test the connection with the token from URL
      testExactApi(tokenFromUrl);
    }
  }, [searchParams]);
  
  const testExactApi = async (tokenToUse?: string) => {
    const tokenToTest = tokenToUse || token;
    
    if (!tokenToTest) {
      setTestResult('Voer eerst een token in');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/exact/test-with-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenToTest }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API-test mislukt');
      }
      
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-black">Exact Online API Test</h1>
      
      <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
        <h2 className="font-bold text-black">Fout</h2>
        <p className="text-black">Niet ingelogd. Log in bij Exact Online om de API te testen.</p>
        <div className="mt-4">
          <ExactLoginButton />
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-black">Handmatige Token Test</h2>
        
        <div className="mb-4">
          <label htmlFor="token" className="block text-sm font-medium text-black mb-2">
            Exact API Token
          </label>
          <input
            type="text"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-black"
            placeholder="Voer je Exact API token in"
          />
        </div>
        
        <button
          onClick={() => testExactApi()}
          disabled={isLoading}
          className="bg-blue-500 text-black px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Bezig met testen...' : 'Test API'}
        </button>
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-500">
            <p className="text-black font-bold">Fout:</p>
            <p className="text-black">{error}</p>
          </div>
        )}
        
        {testResult && (
          <div className="mt-4">
            <h3 className="font-semibold text-black mb-2">Test Resultaat:</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-black">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 