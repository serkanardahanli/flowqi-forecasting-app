'use client'

import { useState, useEffect } from 'react'
import { updatePassword } from '@/utils/supabase/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/app/components/Logo'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/utils/supabase/client'

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Wachtwoord moet minimaal 6 tekens bevatten'),
  confirmPassword: z.string().min(6, 'Wachtwoord moet minimaal 6 tekens bevatten'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword'],
})

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>

export default function UpdatePassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  
  const { register, handleSubmit, formState: { errors } } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })
  
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Deze link is ongeldig of verlopen. Vraag een nieuwe wachtwoord reset link aan.')
      } else {
        setIsAuthenticated(true)
      }
    }
    
    checkUser()
  }, [])
  
  const onSubmit = async (data: UpdatePasswordFormValues) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await updatePassword(data.password)
      
      if (result.error) {
        setError(result.error)
        return
      }
      
      setSuccessMessage('Je wachtwoord is succesvol bijgewerkt. Je wordt nu doorgestuurd naar de inlogpagina.')
      
      // Redirect to sign in page after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin')
      }, 3000)
    } catch (error) {
      setError('Er is een onverwachte fout opgetreden. Probeer het later opnieuw.')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Wachtwoord bijwerken
        </h2>
        
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded relative" role="alert">
            <p>{error}</p>
            {!isAuthenticated && (
              <div className="mt-4">
                <Link 
                  href="/auth/reset-password" 
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Terug naar wachtwoord reset
                </Link>
              </div>
            )}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-success-50 border border-success-200 text-success-600 px-4 py-3 rounded relative" role="alert">
            <p>{successMessage}</p>
          </div>
        )}
        
        {isAuthenticated && !successMessage && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Nieuw wachtwoord
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Bevestig nieuw wachtwoord
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
              >
                {isLoading ? 'Bezig met bijwerken...' : 'Wachtwoord bijwerken'}
              </button>
            </div>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Terug naar{' '}
            <Link href="/auth/signin" className="font-medium text-primary-600 hover:text-primary-500">
              Inloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 