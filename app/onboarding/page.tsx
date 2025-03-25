'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createOrganization } from '@/utils/supabase/database';
import { createClient } from '@/utils/supabase/client';
import Logo from '@/app/components/Logo';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const organizationSchema = z.object({
  name: z.string().min(1, 'Bedrijfsnaam is verplicht'),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/signin');
        return;
      }

      setUser(user);
    };

    checkUser();
  }, [router]);

  const onSubmit = async (data: OrganizationFormValues) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await createOrganization(data.name, user.id);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setError('Er is een onverwachte fout opgetreden. Probeer het later opnieuw.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="flex justify-center">
          <Logo />
        </div>

        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Welkom bij FlowQi
        </h2>

        <p className="text-center text-gray-600">
          Laten we beginnen met het instellen van je organisatie
        </p>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded relative" role="alert">
            <p>{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Naam van je organisatie
              </label>
              <input
                id="name"
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                placeholder="Bedrijfsnaam BV"
                {...register('name')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
            >
              {isLoading ? 'Bezig met aanmaken...' : 'Organisatie aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 