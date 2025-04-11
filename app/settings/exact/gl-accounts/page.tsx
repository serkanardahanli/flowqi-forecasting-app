'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { ExactLoginButton } from '../login-button';
import { getGLAccounts } from '@/app/lib/exact';

export default function GLAccountsPage() {
  const [token, setToken] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchGLAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If we have a token, use it directly
      if (token) {
        const data = await getGLAccounts(token);
        setAccounts(data.d.results || []);
        return;
      }
      
      // Otherwise, try to get the token from the session
      const response = await fetch('/api/exact/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'session' }) // This will use the session token
      });
      
      if (!response.ok) {
        throw new Error('Niet ingelogd. Log in bij Exact Online om de grootboekrekeningen te synchroniseren.');
      }
      
      const data = await response.json();
      const glAccountsData = await getGLAccounts(data.token);
      setAccounts(glAccountsData.d.results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-black">Grootboekrekeningen Synchroniseren</h1>
      
      {error && error.includes('Niet ingelogd') && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <h2 className="font-bold text-black">Fout</h2>
          <p className="text-black">{error}</p>
          <div className="mt-4">
            <ExactLoginButton />
          </div>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Handmatige Token</h2>
        
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
        
        <Button 
          onClick={fetchGLAccounts} 
          disabled={isLoading}
          className="bg-blue-500 text-black"
        >
          {isLoading ? 'Bezig met ophalen...' : 'Haal Grootboekrekeningen op'}
        </Button>
      </div>
      
      {accounts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-black">Grootboekrekeningen</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Beschrijving</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account.ID}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{account.Code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{account.Description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{account.Type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 