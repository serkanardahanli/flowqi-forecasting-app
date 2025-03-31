'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import type { Database } from '@/app/lib/database.types';
import ExpensesTable from './components/ExpensesTable';
import IncomeTable from './components/IncomeTable';

export default function BudgetPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'income' | 'expenses'>('income');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializePage = async () => {
      console.log('Budget page initialization started');
      try {
        const supabase = getBrowserSupabaseClient();
        console.log('Supabase client obtained');

        // Get or create default scenario
        const { data: scenarios, error: scenariosError } = await supabase
          .from('scenarios')
          .select('id')
          .eq('is_default', true)
          .limit(1);
        
        console.log('Scenarios query result:', {
          count: scenarios?.length || 0,
          scenariosError: scenariosError?.message || 'none'
        });

        if (scenariosError) throw scenariosError;

        let finalScenarioId = null;
        
        if (scenarios && scenarios.length > 0) {
          // Use existing default scenario
          finalScenarioId = scenarios[0].id;
          console.log('Using existing default scenario:', finalScenarioId);
        } else {
          // Create default scenario if none exists
          console.log('Creating default scenario');
          const { data: newScenario, error: createError } = await supabase
            .from('scenarios')
            .insert({
              name: 'Standaard Scenario',
              is_default: true,
              organization_id: '00000000-0000-0000-0000-000000000000'
            })
            .select()
            .single();

          console.log('Create scenario result:', {
            success: !!newScenario,
            newId: newScenario?.id || 'none',
            createError: createError?.message || 'none'
          });

          if (createError) throw createError;
          finalScenarioId = newScenario.id;
        }

        if (isMounted) {
          console.log('Setting scenario ID to:', finalScenarioId);
          setScenarioId(finalScenarioId);
        }

        console.log('Budget page initialization completed successfully');
      } catch (err: any) {
        console.error('Initialization error:', {
          name: err.name,
          message: err.message,
          code: err.code,
          details: err.details,
          hint: err.hint,
          stack: err.stack
        });
        
        if (isMounted) {
          setError(err.message || 'Er is een onverwachte fout opgetreden');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializePage();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-[#6366F1] text-white px-4 py-2 rounded hover:bg-[#4F46E5]"
        >
          Probeer opnieuw
        </button>
      </div>
    );
  }

  if (!scenarioId) {
    return (
      <div className="text-gray-500 p-4 text-center">
        <p className="mb-4">Geen standaard scenario gevonden. Maak eerst een scenario aan.</p>
        <button 
          className="bg-[#6366F1] text-white px-4 py-2 rounded hover:bg-[#4F46E5]"
          onClick={() => window.location.reload()}
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#6366F1] mb-6">Budget Planning</h1>
      
      <div className="mb-6">
        <label className="mr-2">Jaar:</label>
        <select 
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="border rounded p-1"
        >
          {[2024, 2025, 2026, 2027, 2028].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('income')}
            className={`py-2 px-1 border-b-2 ${
              activeTab === 'income'
                ? 'border-[#6366F1] text-[#6366F1]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Inkomsten
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-2 px-1 border-b-2 ${
              activeTab === 'expenses'
                ? 'border-[#6366F1] text-[#6366F1]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Uitgaven
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'income' ? (
          <IncomeTable year={year} scenarioId={scenarioId} />
        ) : (
          <ExpensesTable year={year} scenarioId={scenarioId} />
        )}
      </div>
    </div>
  );
} 