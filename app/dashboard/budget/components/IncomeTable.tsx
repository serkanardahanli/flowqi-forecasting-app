'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

type IncomeItem = {
  id: string;
  year: number;
  month: number;
  income_type: 'consultancy' | 'saas';
  description: string;
  hours?: number;
  rate?: number;
  users?: number;
  module_price?: number;
  amount: number;
  scenario_id: string;
  organization_id: string;
};

const months = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

export default function IncomeTable({ 
  year, 
  scenarioId 
}: { 
  year: number; 
  scenarioId: string;
}) {
  const [incomeItems, setIncomeItems] = useState<IncomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state for editing
  const [editForm, setEditForm] = useState<Partial<IncomeItem>>({});
  
  // Load income data
  useEffect(() => {
    const fetchIncomeData = async () => {
      if (!scenarioId) return;
      
      setLoading(true);
      try {
        const supabase = getBrowserSupabaseClient();
        
        const { data, error } = await supabase
          .from('budget_income')
          .select('*')
          .eq('year', year)
          .eq('scenario_id', scenarioId)
          .order('month');
          
        if (error) throw error;
        
        setIncomeItems(data || []);
      } catch (err: any) {
        console.error('Error loading income data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchIncomeData();
  }, [year, scenarioId]);
  
  // Handle edit form changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;
    
    // Parse numeric values
    if (['hours', 'rate', 'users', 'module_price', 'amount', 'month'].includes(name)) {
      parsedValue = parseFloat(value) || 0;
    }
    
    setEditForm({
      ...editForm,
      [name]: parsedValue
    });
  };
  
  // Calculate amount based on type and inputs
  const calculateAmount = () => {
    if (editForm.income_type === 'consultancy' && editForm.hours && editForm.rate) {
      return editForm.hours * editForm.rate;
    } else if (editForm.income_type === 'saas' && editForm.users && editForm.module_price) {
      return editForm.users * editForm.module_price;
    }
    return editForm.amount || 0;
  };
  
  // Save edited item
  const saveItem = async () => {
    if (!editForm.id || !scenarioId) return;
    
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Calculate final amount
      const finalAmount = calculateAmount();
      
      // Ensure organization_id is set
      const dataToUpdate = {
        ...editForm, 
        amount: finalAmount,
        organization_id: editForm.organization_id || '00000000-0000-0000-0000-000000000000'
      };
      
      const { error } = await supabase
        .from('budget_income')
        .update(dataToUpdate)
        .eq('id', editForm.id);
        
      if (error) throw error;
      
      // Update local state
      setIncomeItems(prevItems => 
        prevItems.map(item => 
          item.id === editForm.id 
            ? { ...item, ...dataToUpdate } 
            : item
        )
      );
      
      // Exit edit mode
      setEditingId(null);
      setEditForm({});
      
    } catch (err: any) {
      console.error('Error saving income item:', err);
      setError(err.message);
    }
  };
  
  // Delete an item
  const deleteItem = async (id: string) => {
    if (!id) return;
    
    try {
      const supabase = getBrowserSupabaseClient();
      
      const { error } = await supabase
        .from('budget_income')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setIncomeItems(prevItems => prevItems.filter(item => item.id !== id));
      
    } catch (err: any) {
      console.error('Error deleting income item:', err);
      setError(err.message);
    }
  };
  
  // Start editing an item
  const startEdit = (item: IncomeItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };
  
  // Calculate totals
  const calculateTotals = () => {
    const totals = {
      byMonth: Array(12).fill(0),
      byType: {
        consultancy: 0,
        saas: 0
      },
      overall: 0
    };
    
    incomeItems.forEach(item => {
      // Add to month total (month is 1-indexed)
      if (item.month >= 1 && item.month <= 12) {
        totals.byMonth[item.month - 1] += item.amount;
      }
      
      // Add to type total
      if (item.income_type === 'consultancy') {
        totals.byType.consultancy += item.amount;
      } else if (item.income_type === 'saas') {
        totals.byType.saas += item.amount;
      }
      
      // Add to overall total
      totals.overall += item.amount;
    });
    
    return totals;
  };
  
  const totals = calculateTotals();
  
  if (loading) {
    return <div className="text-center py-4">Inkomsten laden...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 py-4">Fout bij laden inkomsten: {error}</div>;
  }
  
  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#6366F1]">Inkomsten Planning {year}</h2>
        <button 
          className="bg-[#6366F1] text-white px-3 py-1 rounded-md flex items-center"
          onClick={() => alert('Add new income item')}
        >
          <PlusIcon className="h-4 w-4 mr-1" /> Nieuwe Inkomst
        </button>
      </div>
      
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-3 border text-left">Type</th>
            <th className="py-2 px-3 border text-left">Omschrijving</th>
            <th className="py-2 px-3 border text-left">Maand</th>
            <th className="py-2 px-3 border text-right">Uren/Users</th>
            <th className="py-2 px-3 border text-right">Tarief/Prijs</th>
            <th className="py-2 px-3 border text-right">Bedrag</th>
            <th className="py-2 px-3 border text-center">Acties</th>
          </tr>
        </thead>
        <tbody>
          {incomeItems.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-4 text-center text-gray-500">
                Geen inkomsten gevonden. Voeg een inkomst toe om te beginnen.
              </td>
            </tr>
          ) : (
            incomeItems.map(item => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                {editingId === item.id ? (
                  // Edit mode
                  <>
                    <td className="py-2 px-3 border">
                      <select 
                        name="income_type"
                        value={editForm.income_type || ''}
                        onChange={handleEditChange}
                        className="w-full p-1 border rounded"
                      >
                        <option value="consultancy">Consultancy</option>
                        <option value="saas">SaaS</option>
                      </select>
                    </td>
                    <td className="py-2 px-3 border">
                      <input 
                        type="text"
                        name="description"
                        value={editForm.description || ''}
                        onChange={handleEditChange}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="py-2 px-3 border">
                      <select 
                        name="month"
                        value={editForm.month || 1}
                        onChange={handleEditChange}
                        className="w-full p-1 border rounded"
                      >
                        {months.map((name, index) => (
                          <option key={index} value={index + 1}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3 border">
                      {editForm.income_type === 'consultancy' ? (
                        <input 
                          type="number"
                          name="hours"
                          value={editForm.hours || 0}
                          onChange={handleEditChange}
                          className="w-full p-1 border rounded text-right"
                        />
                      ) : (
                        <input 
                          type="number"
                          name="users"
                          value={editForm.users || 0}
                          onChange={handleEditChange}
                          className="w-full p-1 border rounded text-right"
                        />
                      )}
                    </td>
                    <td className="py-2 px-3 border">
                      {editForm.income_type === 'consultancy' ? (
                        <input 
                          type="number"
                          name="rate"
                          value={editForm.rate || 0}
                          onChange={handleEditChange}
                          className="w-full p-1 border rounded text-right"
                        />
                      ) : (
                        <input 
                          type="number"
                          name="module_price"
                          value={editForm.module_price || 0}
                          onChange={handleEditChange}
                          className="w-full p-1 border rounded text-right"
                        />
                      )}
                    </td>
                    <td className="py-2 px-3 border text-right">
                      €{calculateAmount().toFixed(2)}
                    </td>
                    <td className="py-2 px-3 border text-center">
                      <button 
                        onClick={saveItem}
                        className="text-green-600 hover:text-green-800 mr-2"
                      >
                        Opslaan
                      </button>
                      <button 
                        onClick={() => {
                          setEditingId(null);
                          setEditForm({});
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Annuleren
                      </button>
                    </td>
                  </>
                ) : (
                  // View mode
                  <>
                    <td className="py-2 px-3 border">
                      {item.income_type === 'consultancy' ? 'Consultancy' : 'SaaS'}
                    </td>
                    <td className="py-2 px-3 border">{item.description}</td>
                    <td className="py-2 px-3 border">
                      {item.month >= 1 && item.month <= 12 ? months[item.month - 1] : 'Onbekend'}
                    </td>
                    <td className="py-2 px-3 border text-right">
                      {item.income_type === 'consultancy' 
                        ? `${item.hours || 0} uur` 
                        : `${item.users || 0} users`}
                    </td>
                    <td className="py-2 px-3 border text-right">
                      {item.income_type === 'consultancy' 
                        ? `€${(item.rate || 0).toFixed(2)}` 
                        : `€${(item.module_price || 0).toFixed(2)}`}
                    </td>
                    <td className="py-2 px-3 border text-right font-medium">
                      €{item.amount.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 border text-center">
                      <button 
                        onClick={() => startEdit(item)}
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
                  </>
                )}
              </tr>
            ))
          )}
          
          {/* Totals row */}
          <tr className="bg-gray-100 font-semibold">
            <td colSpan={5} className="py-2 px-3 border text-right">Totaal</td>
            <td className="py-2 px-3 border text-right">€{totals.overall.toFixed(2)}</td>
            <td className="py-2 px-3 border"></td>
          </tr>
        </tbody>
      </table>
      
      {/* Summary section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-3 text-[#6366F1]">Per Type</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Consultancy</span>
              <span>€{totals.byType.consultancy.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>SaaS</span>
              <span>€{totals.byType.saas.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold">
              <span>Totaal</span>
              <span>€{totals.overall.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-3 text-[#6366F1]">Per Maand</h3>
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => (
              <div key={index} className="flex justify-between">
                <span>{month}</span>
                <span>€{totals.byMonth[index].toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 