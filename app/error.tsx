'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-6 bg-white rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Er is iets misgegaan</h2>
        <p className="text-gray-600 mb-6">
          Er is een fout opgetreden bij het laden van deze pagina. Probeer het opnieuw of ga terug naar het dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Probeer opnieuw
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors text-center"
          >
            Terug naar dashboard
          </a>
        </div>
      </div>
    </div>
  );
} 