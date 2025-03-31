'use client';

import { useEffect, useState } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface Organization {
  id: string;
  name: string;
  owner_id: string;
}

export default function SettingsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(true); // Default to true in the simplified version
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    const fetchOrganizationData = async () => {
      const supabase = getBrowserSupabaseClient();

      try {
        // Get first organization from the database
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .limit(1)
          .single();

        if (orgError) throw orgError;

        setOrganization(orgData);

        // Set form default values
        reset({
          name: orgData.name,
        });
      } catch (err: any) {
        console.error('Error fetching organization data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, [reset]);

  const onSubmit = async (data: OrganizationFormValues) => {
    if (!organization || !isOwner) return;

    setSaving(true);
    setSuccessMessage(null);
    setError(null);

    const supabase = getBrowserSupabaseClient();

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: data.name })
        .eq('id', organization.id);

      if (error) throw error;

      setSuccessMessage('Organization settings updated successfully');
      setOrganization({
        ...organization,
        name: data.name,
      });
    } catch (err: any) {
      console.error('Error updating organization:', err);
      setError(err.message || 'Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Organization not found</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Please contact your administrator to resolve this issue.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Organization Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your organization's settings and preferences
        </p>
      </div>

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Organization Name
            </label>
            <div className="mt-1">
              <input
                id="name"
                type="text"
                {...register('name')}
                disabled={!isOwner}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                  errors.name ? 'border-red-500' : 'border-gray-200'
                } ${!isOwner ? 'cursor-not-allowed bg-gray-100' : ''}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Owner</label>
            <div className="mt-1">
              <p className="text-sm text-gray-500">
                {isOwner ? 'You are the owner of this organization' : 'You are not the owner'}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center rounded-md border border-transparent bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="rounded-md bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Danger Zone</h2>
        <p className="mt-1 text-sm text-gray-500">
          Actions here can have significant consequences. Please proceed with caution.
        </p>

        <div className="mt-6">
          <button
            type="button"
            disabled={true} // Disabled for now, would need special confirmation UI
            className="inline-flex justify-center rounded-md border border-transparent bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Delete Organization
          </button>
        </div>
      </div>
    </div>
  );
} 