'use client';

import { useEffect, useState } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import Link from 'next/link';
import { PlusIcon, UserIcon } from '@heroicons/react/24/outline';

interface TeamMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: 'admin' | 'user';
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(true); // Default to admin for simplified version

  useEffect(() => {
    const fetchTeamMembers = async () => {
      const supabase = getBrowserSupabaseClient();

      try {
        // Get all team members
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, role')
          .order('email');

        if (error) {
          throw error;
        }

        setMembers(data || []);
      } catch (err: any) {
        console.error('Error fetching team members:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

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
            <h3 className="text-sm font-medium text-red-800">Error loading team members</h3>
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Team</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your team members and their permissions</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/team/invite"
            className="inline-flex items-center rounded-md bg-primary-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Invite Team Member
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <ul role="list" className="divide-y divide-gray-200">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {member.first_name && member.last_name
                      ? `${member.first_name} ${member.last_name}`
                      : member.email}
                  </p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    member.role === 'admin'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {member.role === 'admin' ? 'Admin' : 'User'}
                </span>
                {isAdmin && member.role !== 'admin' && (
                  <Link
                    href={`/dashboard/team/${member.id}/edit`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-900"
                  >
                    Edit
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isAdmin && (
        <div className="rounded-md bg-gray-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">About permissions</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>
                  <strong>Admins</strong> can manage team members, organization settings, and have
                  full access to all features.
                </p>
                <p className="mt-1">
                  <strong>Users</strong> can view and edit forecasts, products, and expenses, but
                  cannot manage team members or organization settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 