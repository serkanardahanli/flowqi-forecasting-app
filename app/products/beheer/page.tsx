"use client";

import React, { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import { Product, ProductType } from '@/types/models';
import { PencilIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ProductGroup {
  id: string;
  name: string;
  description: string | null;
}

export default function ProductManagementPage() {
  // State voor het beheren van de productenlijst
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State voor productgroepen
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  // State voor het bewerken van een product
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    price: '',
    is_required: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Producten en groepen ophalen bij het laden van de pagina
  useEffect(() => {
    fetchProducts();
    fetchGroups();
  }, []);
  
  // Functie om productgroepen op te halen
  const fetchGroups = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      
      const { data, error } = await supabase
        .from('product_groups')
        .select('id, name, description')
        .order('name');
        
      if (error) throw error;
      
      setGroups(data || []);
    } catch (err) {
      console.error('Error fetching product groups:', err);
    }
  };
  
  // Functie om producten op te halen uit Supabase
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = getBrowserSupabaseClient();
      
      let query = supabase
        .from('products')
        .select(`
          *,
          gl_account:gl_account_id(name, code)
        `)
        .order('name');
      
      // Filter op groep als er een groep is geselecteerd
      if (selectedGroup) {
        query = query.eq('group_id', selectedGroup);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Er is een fout opgetreden bij het ophalen van producten');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter producten op basis van geselecteerde groep
  useEffect(() => {
    fetchProducts();
  }, [selectedGroup]);
  
  // Formulier invullen met product data (voor bewerken)
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      price: product.price?.toString() || '0',
      is_required: product.is_required || false
    });
    // Scroll naar formulier
    document.getElementById('productForm')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Formulier resetten
  const handleCancel = () => {
    setEditingProduct(null);
    setFormData({
      price: '',
      is_required: false
    });
    setFormError(null);
    setFormSuccess(false);
  };
  
  // Formulier invoer bijwerken
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Product bijwerken
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(false);
    
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Prijs omzetten naar numerieke waarde
      const priceValue = parseFloat(formData.price) || 0;
      
      // Object voor update
      const productData = {
        price: priceValue,
        is_required: formData.is_required
      };
      
      // Update bestaand product
      const result = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);
        
      if (result.error) throw result.error;
      
      // Success message
      setFormSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        handleCancel();
      }, 2000);
      
      // Refresh product list
      fetchProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      setFormError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het bijwerken van het product.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Groep filter resetten
  const resetGroupFilter = () => {
    setSelectedGroup(null);
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Beheer</h1>
        <div className="flex space-x-2">
          <Link href="/products/verkopen" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Verkoopgegevens
          </Link>
        </div>
      </div>
      
      {/* Groep filter */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <label className="mr-2 text-gray-700">Filter op groep:</label>
            <select
              value={selectedGroup || ''}
              onChange={(e) => setSelectedGroup(e.target.value || null)}
              className="p-2 border rounded"
            >
              <option value="">Alle groepen</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedGroup && (
            <button
              onClick={resetGroupFilter}
              className="text-blue-500 hover:text-blue-700"
            >
              Filter wissen
            </button>
          )}
        </div>
      </div>
      
      {/* Formulier voor bewerken */}
      {editingProduct && (
        <div id="productForm" className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Product Bewerken: {editingProduct.name}
          </h2>
          
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {formError}
            </div>
          )}
          
          {formSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Product is succesvol bijgewerkt.
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-1">Naam</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Type</label>
                <input
                  type="text"
                  value={editingProduct.type}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Prijs (€) *</label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Grootboekrekening</label>
                <input
                  type="text"
                  value={editingProduct.gl_account ? `${editingProduct.gl_account.code} - ${editingProduct.gl_account.name}` : '-'}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Productgroep</label>
                <input
                  type="text"
                  value={editingProduct.group_id ? 
                    groups.find(g => g.id === editingProduct.group_id)?.name || '-' : 
                    '-'
                  }
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_required"
                  checked={formData.is_required}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-gray-700">Verplicht product</label>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {isSubmitting ? 'Opslaan...' : 'Bijwerken'}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Productenlijst */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-gray-50 border-b">Producten</h2>
        
        {loading ? (
          <div className="p-4 text-center">Laden...</div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : products.length === 0 ? (
          <div className="p-4 text-center text-gray-500">Geen producten gevonden.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prijs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grootboekrekening</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groep</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verplicht</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.type === 'saas' ? 'bg-blue-100 text-blue-800' : 
                        product.type === 'hardware' ? 'bg-green-100 text-green-800' : 
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {product.type === 'saas' ? 'SaaS' : 
                         product.type === 'hardware' ? 'Hardware' : 'Service'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.price != null ? `€${product.price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.gl_account ? `${product.gl_account.code} - ${product.gl_account.name}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.group_id ? 
                        groups.find(g => g.id === product.group_id)?.name || '-' : 
                        '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.is_required ? 'Ja' : 'Nee'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-5 w-5" />
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
  );
} 