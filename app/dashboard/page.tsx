'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/app/hooks/useSupabase';
import MainLayout from '@/app/components/MainLayout';
import { getOrganizationId, ensureClientUserProfile } from '@/app/utils/auth';

export default function DashboardPage() {
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabase();

  async function loadOrganizationData() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        window.location.href = '/auth/signin';
        return;
      }

      // Ensure user profile is properly set up
      await ensureClientUserProfile(session.user.id);
      
      const organizationId = await getOrganizationId();
      if (!organizationId) {
        setError('Geen organisatie gevonden. Log opnieuw in of neem contact op met ondersteuning.');
        setLoading(false);
        return;
      }

      const { data: organization, error: organizationError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

      if (organizationError) {
        console.error('Error loading organization:', organizationError);
        setError('Er ging iets mis bij het laden van de organisatiegegevens.');
      } else {
        setOrganizationName(organization.name);
      }
    } catch (error) {
      console.error('Error in loadOrganizationData:', error);
      setError('Er is een onverwachte fout opgetreden.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrganizationData();
  }, []);

  return (
    <MainLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Welkom bij {organizationName}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Uw financiële planning en budgettering portal
                  </p>
                </div>
                {/* Dashboard content will go here */}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}