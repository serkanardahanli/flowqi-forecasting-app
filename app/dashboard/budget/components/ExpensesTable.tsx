'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

type ExpenseItem = {
  id: string;
  year: number;
  month: number;
  cost_category: string;
  sub_category?: string;
  description: string;
  amount: number;
  scenario_id: string;
  organization_id: string;
};

const months = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

// Common expense categories
const expenseCategories = [
  { value: 'personeelskosten', label: 'Personeelskosten' },
  { value: 'huisvesting', label: 'Huisvesting' },
  { value: 'verkoop', label: 'Verkoop & Marketing' },
  { value: 'ict', label: 'ICT & Software' },
  { value: 'kantoorkosten', label: 'Kantoorkosten' },
  { value: 'advieskosten', label: 'Advieskosten' },
  { value: 'overige', label: 'Overige kosten' },
];

export default function ExpensesTable({ 
  year, 
  scenarioId 
}: { 
  year: number; 
  scenarioId: string;
}) {
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ExpenseItem>>({});

  useEffect(() => {
    const fetchExpenseData = async () => {
      if (!scenarioId) return;
      
      setLoading(true);
      try {
        const supabase = getBrowserSupabaseClient();
        
        const { data, error } = await supabase
          .from('budget_expenses')
          .select('*')
          .eq('year', year)
          .eq('scenario_id', scenarioId)
          .order('cost_category')
          .order('month');
          
        if (error) throw error;
        
        setExpenseItems(data || []);
      } catch (err: any) {
        console.error('Error loading expense data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpenseData();
  }, [year, scenarioId]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;
    
    if (['amount', 'month'].includes(name)) {
      parsedValue = parseFloat(value) || 0;
    }
    
    setEditForm({
      ...editForm,
      [name]: parsedValue
    });
  };

  const saveItem = async () => {
    if (!editForm.id || !scenarioId) return;
    
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Ensure organization_id is set
      const dataToUpdate = {
        ...editForm,
        organization_id: editForm.organization_id || '00000000-0000-0000-0000-000000000000'
      };
      
      const { error } = await supabase
        .from('budget_expenses')
        .update(dataToUpdate)
        .eq('id', editForm.id);
        
      if (error) throw error;
      
      setExpenseItems(prevItems => 
        prevItems.map(item => 
          item.id === editForm.id 
            ? { ...item, ...dataToUpdate } 
            : item
        )
      );
      
      setEditingId(null);
      setEditForm({});
      
    } catch (err: any) {
      console.error('Error saving expense item:', err);
      setError(err.message);
    }
  };

  const deleteItem = async (id: string) => {
    if (!id) return;
    
    try {
      const supabase = getBrowserSupabaseClient();
      
      const { error } = await supabase
        .from('budget_expenses')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setExpenseItems(prevItems => prevItems.filter(item => item.id !== id));
      
    } catch (err: any) {
      console.error('Error deleting expense item:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Uitgaven laden...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-4">Fout bij laden uitgaven: {error}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#6366F1]">Uitgaven Planning {year}</h2>
        <button 
          className="bg-[#6366F1] text-white px-3 py-1 rounded-md flex items-center"
          onClick={() => alert('Add new expense item')}
        >
          <PlusIcon className="h-4 w-4 mr-1" /> Nieuwe Uitgave
        </button>
      </div>
      
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-3 border text-left">Categorie</th>
            <th className="py-2 px-3 border text-left">Subcategorie</th>
            <th className="py-2 px-3 border text-left">Omschrijving</th>
            <th className="py-2 px-3 border text-left">Maand</th>
            <th className="py-2 px-3 border text-right">Bedrag</th>
            <th className="py-2 px-3 border text-center">Acties</th>
          </tr>
        </thead>
        <tbody>
          {expenseItems.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-500">
                Geen uitgaven gevonden. Voeg een uitgave toe om te beginnen.
              </td>
            </tr>
          ) : (
            expenseItems.map(item => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3 border">
                  {expenseCategories.find(c => c.value === item.cost_category)?.label || item.cost_category}
                </td>
                <td className="py-2 px-3 border">{item.sub_category || '-'}</td>
                <td className="py-2 px-3 border">{item.description}</td>
                <td className="py-2 px-3 border">
                  {item.month >= 1 && item.month <= 12 ? months[item.month - 1] : 'Onbekend'}
                </td>
                <td className="py-2 px-3 border text-right font-medium">
                  €{item.amount.toFixed(2)}
                </td>
                <td className="py-2 px-3 border text-center">
                  <button 
                    onClick={() => {
                      setEditingId(item.id);
                      setEditForm(item);
                    }}
                    className="text-blue-600 hover:text-blue-800 mr-2"
                  >
                    <PencilIcon className="h-4 w-4 inline" />
                  </button>
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-4 w-4 inline" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 