"use client";

import React, { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import MainLayout from '@/app/components/MainLayout';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ProductGroup {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export default function ProductGroupsPage() {
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Omit<ProductGroup, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    description: '',
    organization_id: '00000000-0000-0000-0000-000000000000' // Default organization ID
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  
  useEffect(() => {
    fetchGroups();
  }, []);
  
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const supabase = getBrowserSupabaseClient();
      
      const { data, error } = await supabase
        .from('product_groups')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      setGroups(data || []);
    } catch (err) {
      console.error('Error fetching product groups:', err);
      setError('Er is een fout opgetreden bij het ophalen van productgroepen.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (group: ProductGroup) => {
    setFormData({
      name: group.name,
      description: group.description || '',
      organization_id: group.organization_id
    });
    setEditingGroup(group.id);
    document.getElementById('groupForm')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      organization_id: '00000000-0000-0000-0000-000000000000'
    });
    setEditingGroup(null);
    setFormError(null);
    setFormSuccess(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(false);
    
    try {
      const supabase = getBrowserSupabaseClient();
      
      if (!formData.name) {
        throw new Error('Naam is een verplicht veld.');
      }
      
      const groupData = {
        name: formData.name,
        description: formData.description || null,
        organization_id: formData.organization_id
      };
      
      let result;
      
      if (editingGroup) {
        result = await supabase
          .from('product_groups')
          .update(groupData)
          .eq('id', editingGroup);
          
        if (result.error) throw result.error;
      } else {
        result = await supabase
          .from('product_groups')
          .insert([groupData])
          .select();
          
        if (result.error) throw result.error;
      }
      
      setFormSuccess(true);
      
      setTimeout(() => {
        resetForm();
      }, 2000);
      
      fetchGroups();
    } catch (err) {
      console.error('Error submitting product group:', err);
      setFormError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het opslaan van de productgroep.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze productgroep wilt verwijderen? Dit kan gevolgen hebben voor producten die aan deze groep zijn gekoppeld.')) {
      return;
    }
    
    try {
      const supabase = getBrowserSupabaseClient();
      
      const { error } = await supabase
        .from('product_groups')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      if (editingGroup === id) {
        resetForm();
      }
      
      fetchGroups();
    } catch (err) {
      console.error('Error deleting product group:', err);
      alert('Er is een fout opgetreden bij het verwijderen van de productgroep.');
    }
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Productgroepen Beheer</h1>
        
        {/* Formulier voor nieuwe groep of bewerken */}
        <div id="groupForm" className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingGroup ? 'Productgroep Bewerken' : 'Nieuwe Productgroep'}
          </h2>
          
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {formError}
            </div>
          )}
          
          {formSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Productgroep is succesvol {editingGroup ? 'bijgewerkt' : 'toegevoegd'}.
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-1">Naam *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Omschrijving</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {isSubmitting ? 'Opslaan...' : editingGroup ? 'Bijwerken' : 'Toevoegen'}
              </button>
              
              {editingGroup && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Annuleren
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Productgroepen lijst */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="text-xl font-semibold p-4 bg-gray-50 border-b">Productgroepen</h2>
          
          {loading ? (
            <div className="p-4 text-center">Laden...</div>
          ) : error ? (
            <div className="p-4 text-red-500">{error}</div>
          ) : groups.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Geen productgroepen gevonden.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Omschrijving</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groups.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{group.name}</td>
                      <td className="px-6 py-4">{group.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEdit(group)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(group.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 