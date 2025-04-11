'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';

export default function ManualTestPage() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const testConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/exact/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API-test mislukt');
      }
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-black">Handmatige API Test</h1>
      
      <div className="mb-4">
        <label className="block text-black mb-2">Exact API Token:</label>
        <textarea 
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full p-2 border rounded text-black"
          rows={5}
        />
      </div>
      
      <Button 
        onClick={testConnection} 
        disabled={isLoading || !token}
        className="bg-blue-500 text-black"
      >
        {isLoading ? 'Bezig met testen...' : 'Test Verbinding'}
      </Button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-500">
          <p className="text-black font-bold">Fout:</p>
          <p className="text-black">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 bg-green-100 border-l-4 border-green-500">
          <p className="text-black font-bold">Resultaat:</p>
          <pre className="text-black overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
} 