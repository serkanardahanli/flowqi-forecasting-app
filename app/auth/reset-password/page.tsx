'use client'

import { useState } from 'react'
import { resetPassword } from '@/utils/supabase/auth'
import Link from 'next/link'
import Logo from '@/app/components/Logo'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const resetPasswordSchema = z.object({
  email: z.string().email('Voer een geldig e-mailadres in'),
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  })
  
  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const result = await resetPassword(data.email)
      
      if (result.error) {
        setError(result.error)
        return
      }
      
      setSuccessMessage('We hebben een e-mail met een link om je wachtwoord te resetten verstuurd. Controleer je inbox.')
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
          Wachtwoord resetten
        </h2>
        
        <p className="text-center text-gray-600">
          Voer je e-mailadres in en we sturen je een link om je wachtwoord te resetten.
        </p>
        
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded relative" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-success-50 border border-success-200 text-success-600 px-4 py-3 rounded relative" role="alert">
            <p>{successMessage}</p>
          </div>
        )}
        
        {!successMessage && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                placeholder="naam@bedrijf.nl"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
              >
                {isLoading ? 'Bezig met verzenden...' : 'Verstuur reset-link'}
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