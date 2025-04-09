"use client";

import { useState, useEffect } from 'react';
import MainLayout from '@/app/components/MainLayout';
import { PlusIcon, PencilIcon, TrashIcon, FolderIcon } from '@heroicons/react/24/outline';
import { Product, ProductType, GlAccount } from '@/types/models';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import type { Database } from '@/types/supabase';

interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
}

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    price: 0,
    type: 'SaaS' as ProductType,
    gl_account_id: null,
    is_required: false,
    group_id: null,
    organization_id: '00000000-0000-0000-0000-000000000000'
  });
  const [groupFormData, setGroupFormData] = useState<Omit<ProductGroup, 'id'>>({
    name: '',
    description: '',
    organization_id: '00000000-0000-0000-0000-000000000000'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Producten en groepen ophalen
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = getBrowserSupabaseClient();
        
        // Haal alle productgroepen op
        const { data: groupsData, error: groupsError } = await supabase
          .from('product_groups')
          .select('*')
          .order('name');
        
        if (groupsError) {
          console.error('Error fetching groups:', groupsError);
          throw new Error(`Fout bij ophalen groepen: ${groupsError.message}`);
        }
        
        // Haal alle producten op met grootboekrekening informatie
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            gl_account:gl_account_id(code, name, level)
          `)
          .order('name');
        
        if (productsError) {
          console.error('Error fetching products:', productsError);
          throw new Error(`Fout bij ophalen producten: ${productsError.message}`);
        }

        // Haal alle grootboekrekeningen op
        const { data: glAccountsData, error: glAccountsError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('type', 'Inkomsten')
          .eq('level', 3)
          .in('code', ['8011', '8012', '8021', '8022', '8023'])
          .order('code');
        
        if (glAccountsError) {
          console.error('Error fetching GL accounts:', glAccountsError);
          throw new Error(`Fout bij ophalen grootboekrekeningen: ${glAccountsError.message}`);
        }
        
        setGroups(groupsData || []);
        setProducts(productsData || []);
        setGlAccounts(glAccountsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het ophalen van de data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      type: 'SaaS',
      gl_account_id: null,
      is_required: false,
      group_id: null,
      organization_id: '00000000-0000-0000-0000-000000000000'
    });
    setIsEditing(false);
    setEditId(null);
  };

  const resetGroupForm = () => {
    setGroupFormData({
      name: '',
      description: '',
      organization_id: '00000000-0000-0000-0000-000000000000'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const supabase = getBrowserSupabaseClient();
      
      if (isEditing && editId) {
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([formData]);
        
        if (error) throw error;
      }
      
      // Herlaad de producten
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setProducts(data || []);
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het opslaan van het product');
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const supabase = getBrowserSupabaseClient();
      
      const { error } = await supabase
        .from('product_groups')
        .insert([groupFormData]);
      
      if (error) throw error;
      
      // Herlaad de groepen
      const { data, error: fetchError } = await supabase
        .from('product_groups')
        .select('*')
        .order('name');
      
      if (fetchError) throw fetchError;
      
      setGroups(data || []);
      setShowGroupModal(false);
      resetGroupForm();
    } catch (err) {
      console.error('Error saving group:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het opslaan van de groep');
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      type: product.type,
      gl_account_id: product.gl_account_id,
      is_required: product.is_required,
      group_id: product.group_id,
      organization_id: product.organization_id
    });
    setIsEditing(true);
    setEditId(product.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit product wilt verwijderen?')) return;
    
    try {
      const supabase = getBrowserSupabaseClient();
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het verwijderen van het product');
    }
  };

  const handleGroupDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze groep wilt verwijderen? Alle producten in deze groep zullen worden verplaatst naar "Geen groep".')) return;
    
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Eerst alle producten in deze groep updaten
      const { error: updateError } = await supabase
        .from('products')
        .update({ group_id: null })
        .eq('group_id', id);
      
      if (updateError) throw updateError;
      
      // Dan de groep verwijderen
      const { error: deleteError } = await supabase
        .from('product_groups')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      setGroups(groups.filter(g => g.id !== id));
      setProducts(products.map(p => p.group_id === id ? { ...p, group_id: null } : p));
    } catch (err) {
      console.error('Error deleting group:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het verwijderen van de groep');
    }
  };

  const handleFormChange = (
    field: keyof Omit<Product, 'id'>,
    value: string | number | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGroupFormChange = (
    field: keyof Omit<ProductGroup, 'id'>,
    value: string
  ) => {
    setGroupFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredProducts = selectedGroup
    ? products.filter(p => p.group_id === selectedGroup)
    : products.filter(p => !p.group_id);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div>Laden...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Product Beheer</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowGroupModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <FolderIcon className="h-5 w-5 mr-2" />
              Nieuwe Groep
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nieuw Product
            </button>
          </div>
        </div>

        {/* Groepen selector */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedGroup(null)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedGroup === null
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Geen groep
            </button>
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedGroup === group.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <li key={product.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary-600 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.description}
                      </p>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span className="mr-2">€{product.price.toFixed(2)}</span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{product.type}</span>
                        {product.is_required && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-primary-600">Verplicht</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {filteredProducts.length === 0 && (
              <li>
                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  Geen producten gevonden in deze groep
                </div>
              </li>
            )}
          </ul>
        </div>

        {/* Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-medium mb-4">
                {isEditing ? 'Product Bewerken' : 'Nieuw Product'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Naam
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Beschrijving
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Prijs
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleFormChange('price', parseFloat(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleFormChange('type', e.target.value as ProductType)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="saas">SaaS</option>
                      <option value="hardware">Hardware</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Grootboekrekening
                    </label>
                    <select
                      value={formData.gl_account_id || ''}
                      onChange={(e) => handleFormChange('gl_account_id', e.target.value || null)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="">Geen grootboekrekening</option>
                      {glAccounts.map(glAccount => (
                        <option key={glAccount.id} value={glAccount.id}>
                          {glAccount.code} - {glAccount.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Groep
                    </label>
                    <select
                      value={formData.group_id || ''}
                      onChange={(e) => handleFormChange('group_id', e.target.value || null)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="">Geen groep</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_required}
                      onChange={(e) => handleFormChange('is_required', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Verplicht product
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    {isEditing ? 'Opslaan' : 'Toevoegen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Group Modal */}
        {showGroupModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-medium mb-4">Nieuwe Productgroep</h2>
              <form onSubmit={handleGroupSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Naam
                    </label>
                    <input
                      type="text"
                      value={groupFormData.name}
                      onChange={(e) => handleGroupFormChange('name', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Beschrijving
                    </label>
                    <textarea
                      value={groupFormData.description || ''}
                      onChange={(e) => handleGroupFormChange('description', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGroupModal(false);
                      resetGroupForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Toevoegen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 