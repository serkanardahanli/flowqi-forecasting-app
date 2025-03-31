'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'user']),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function InviteTeamMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'user',
    },
  });

  const onSubmit = async (data: InviteFormValues) => {
    setLoading(true);
    setError(null);

    const supabase = getBrowserSupabaseClient();

    try {
      // Send invitation email
      // Note: This is a simplified version, in a real app you would:
      // 1. Create a server-side API endpoint to handle this securely
      // 2. Generate a unique invite token
      // 3. Send an email with a signup link containing the token

      // For now, we'll simulate this by showing a success message
      // In a real app you would also need to handle the signup flow when
      // a user clicks the invite link in their email

      // Navigate back to team list
      alert(`Invitation sent to ${data.email}`);
      router.push('/dashboard/team');
    } catch (err: any) {
      console.error('Error inviting team member:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Invite Team Member</h1>
        <p className="mt-1 text-sm text-gray-500">Send an invitation to join your organization</p>
      </div>

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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1">
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                  errors.email ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <div className="mt-1">
              <select
                id="role"
                {...register('role')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              <strong>Admins</strong> can manage team members and organization settings.
              <br />
              <strong>Users</strong> can view and edit forecasts, products, and expenses.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href="/dashboard/team"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 