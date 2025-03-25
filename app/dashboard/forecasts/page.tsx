'use client';

import { useEffect, useState } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import type { Database } from '@/app/lib/database.types';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

type Forecast = Database['public']['Tables']['forecasts']['Row'];

export default function ForecastsPage() {
  const router = useRouter();
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchForecasts = async () => {
      console.log('Forecasts page initialization started');
      const supabase = getBrowserSupabaseClient();
      console.log('Supabase client obtained');

      try {
        // Check authentication first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('Auth check result:', {
          hasSession: !!session,
          userId: session?.user?.id || 'none',
          authError: sessionError?.message || 'none'
        });
        
        if (sessionError) throw sessionError;
        
        if (!session?.user) {
          console.log('No session found, redirecting to signin');
          router.push('/auth/signin');
          return;
        }

        // Get the user's organization from organization_users table
        const { data: orgUser, error: orgError } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .single();

        console.log('Organization query result:', {
          hasOrgUser: !!orgUser,
          orgId: orgUser?.organization_id || 'none',
          orgError: orgError?.message || 'none'
        });

        if (orgError) throw orgError;
        if (!orgUser?.organization_id) throw new Error('Geen organisatie gevonden voor deze gebruiker');

        // Now fetch forecasts for this organization
        const { data, error: forecastsError } = await supabase
          .from('forecasts')
          .select('*')
          .eq('organization_id', orgUser.organization_id)
          .order('created_at', { ascending: false });

        console.log('Forecasts query result:', {
          count: data?.length || 0,
          forecastsError: forecastsError?.message || 'none'
        });

        if (forecastsError) throw forecastsError;

        if (isMounted) {
          setForecasts(data || []);
        }
        
        console.log('Forecasts page initialization completed successfully');
      } catch (err: any) {
        console.error('Error fetching forecasts:', {
          name: err.name,
          message: err.message,
          code: err.code,
          details: err.details,
          hint: err.hint,
          stack: err.stack
        });
        
        if (isMounted) {
          setError(err.message || 'Failed to fetch forecasts');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchForecasts();
    
    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading forecasts</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Forecasts</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage your financial forecasts</p>
        </div>
        <Link
          href="/dashboard/forecasts/new"
          className="inline-flex items-center rounded-md bg-primary-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          New Forecast
        </Link>
      </div>

      {forecasts.length === 0 ? (
        <div className="rounded-md bg-white p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <PlusIcon className="h-6 w-6 text-primary-500" aria-hidden="true" />
          </div>
          <h3 className="mt-3 text-sm font-medium text-gray-900">No forecasts</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new forecast.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/forecasts/new"
              className="inline-flex items-center rounded-md bg-primary-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              New Forecast
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {forecasts.map((forecast) => (
            <Link
              key={forecast.id}
              href={`/dashboard/forecasts/${forecast.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{forecast.name}</h3>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    {format(new Date(forecast.start_date), 'MMM yyyy')} -{' '}
                    {format(new Date(forecast.end_date), 'MMM yyyy')}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
                    {new Date(forecast.end_date) > new Date() ? 'Active' : 'Completed'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Created {format(new Date(forecast.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 