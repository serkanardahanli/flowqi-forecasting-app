'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const router = useRouter();

  useEffect(() => {
    // Automatisch doorsturen naar dashboard
    // Dit voorkomt de auth redirect loop
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">FlowQi - Inloggen</h1>
          <p className="mt-3 text-gray-600">
            Je wordt automatisch doorgestuurd naar het dashboard...
          </p>
          <div className="mt-6">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 