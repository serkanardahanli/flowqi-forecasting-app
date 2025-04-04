"use client";

import React, { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import { Product, ProductType } from '@/types/models';

export default function ProductTest() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    price: 0,
    type: 'saas' as ProductType,
    gl_account_id: null,
    is_required: false,
    group_id: null,
    organization_id: '00000000-0000-0000-0000-000000000000'
  });
  const [success, setSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Producten ophalen
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = getBrowserSupabaseClient();
        
        console.log('Fetching products...');
        
        // Haal alle producten op
        const { data, error } = await supabase
          .from('products')
          .select('*');
        
        console.log('Query result:', { data, error });
        
        if (error) throw error;
        
        setProducts(data || []);
        setDebugInfo(prev => ({ ...prev, fetchResult: { data, error } }));
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het ophalen van de producten');
        setDebugInfo(prev => ({ ...prev, fetchError: err }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Formulier versturen
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Prepare data for submission
      const dataToSubmit = {
        ...formData,
        // Ensure all required fields are present
        name: formData.name,
        price: formData.price === '' ? 0 : parseFloat(formData.price.toString()) || 0,
        type: formData.type,
        is_required: formData.is_required || false,
        organization_id: formData.organization_id || '00000000-0000-0000-0000-000000000000',
        // Optional fields - only include if they have values
        ...(formData.description ? { description: formData.description } : {}),
        gl_account_id: formData.gl_account_id || null,
        group_id: formData.group_id || null
      };
      
      console.log('Submitting product:', dataToSubmit);
      setDebugInfo(prev => ({ ...prev, submittingData: dataToSubmit }));
      
      // Nieuw product toevoegen
      const { data, error } = await supabase
        .from('products')
        .insert([dataToSubmit])
        .select();
      
      console.log('Insert result:', { data, error });
      setDebugInfo(prev => ({ ...prev, insertResult: { data, error } }));
      
      if (error) {
        console.error('Detailed error:', error);
        setDebugInfo(prev => ({ ...prev, detailedError: error }));
        throw error;
      }
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: 0,
        type: 'saas',
        gl_account_id: null,
        is_required: false,
        group_id: null,
        organization_id: '00000000-0000-0000-0000-000000000000'
      });
      
      // Refresh product list
      const { data: newData, error: fetchError } = await supabase
        .from('products')
        .select('*');
      
      if (fetchError) throw fetchError;
      
      setProducts(newData || []);
      setDebugInfo(prev => ({ ...prev, refreshResult: { data: newData, error: fetchError } }));
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het opslaan van het product');
      setDebugInfo(prev => ({ ...prev, saveError: err }));
    }
  };

  // Test direct SQL query
  const testDirectQuery = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      
      console.log('Testing direct SQL query...');
      
      // Try a simple select query
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);
      
      console.log('Direct query result:', { data, error });
      setDebugInfo(prev => ({ ...prev, directQueryResult: { data, error } }));
      
      if (error) throw error;
      
      alert('Direct query successful! Check console for details.');
    } catch (err) {
      console.error('Error with direct query:', err);
      setDebugInfo(prev => ({ ...prev, directQueryError: err }));
      alert('Error with direct query. Check console for details.');
    }
  };

  // Test RLS policies
  const testRLSPolicies = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      
      console.log('Testing RLS policies...');
      
      // First check if we can read
      const { data: readData, error: readError } = await supabase
        .from('products')
        .select('*')
        .limit(1);
      
      console.log('RLS read test:', { data: readData, error: readError });
      
      // Then try to insert
      const testProduct = {
        name: 'RLS Test Product',
        price: 99.99,
        type: 'saas',
        is_required: false,
        organization_id: '00000000-0000-0000-0000-000000000000'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('products')
        .insert([testProduct])
        .select();
      
      console.log('RLS insert test:', { data: insertData, error: insertError });
      
      setDebugInfo(prev => ({ 
        ...prev, 
        rlsTest: { 
          readTest: { data: readData, error: readError },
          insertTest: { data: insertData, error: insertError }
        } 
      }));
      
      alert('RLS test completed! Check console for details.');
    } catch (err) {
      console.error('Error testing RLS:', err);
      setDebugInfo(prev => ({ ...prev, rlsTestError: err }));
      alert('Error testing RLS. Check console for details.');
    }
  };

  // Test with minimal required fields
  const testMinimalProduct = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      
      console.log('Testing with minimal product data...');
      
      // Create a minimal product with only required fields
      const minimalProduct = {
        name: 'Minimal Test Product',
        price: 99.99,
        type: 'saas' as ProductType,
        is_required: false,
        organization_id: '00000000-0000-0000-0000-000000000000'
        // No description field to avoid database issues
      };
      
      console.log('Minimal product data:', minimalProduct);
      
      // Try to insert the minimal product
      const { data, error } = await supabase
        .from('products')
        .insert([minimalProduct])
        .select();
      
      console.log('Minimal product insert result:', { data, error });
      
      if (error) {
        console.error('Error inserting minimal product:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        setDebugInfo(prev => ({ ...prev, minimalProductError: error }));
        alert('Error inserting minimal product. Check console for details.');
      } else {
        setDebugInfo(prev => ({ ...prev, minimalProductResult: data }));
        alert('Minimal product inserted successfully! Check console for details.');
        
        // Refresh product list
        const { data: newData, error: fetchError } = await supabase
          .from('products')
          .select('*');
        
        if (fetchError) throw fetchError;
        
        setProducts(newData || []);
      }
    } catch (err) {
      console.error('Error testing minimal product:', err);
      setDebugInfo(prev => ({ ...prev, minimalProductTestError: err }));
      alert('Error testing minimal product. Check console for details.');
    }
  };

  // Check database schema
  const checkDatabaseSchema = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      
      console.log('Checking database schema...');
      
      // Query to get column information
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: 'products' });
      
      console.log('Schema check result:', { data, error });
      
      if (error) {
        console.error('Error checking schema:', error);
        setDebugInfo(prev => ({ ...prev, schemaCheckError: error }));
        alert('Error checking schema. Check console for details.');
      } else {
        setDebugInfo(prev => ({ ...prev, schemaInfo: data }));
        alert('Schema check completed! Check console for details.');
      }
    } catch (err) {
      console.error('Error checking schema:', err);
      setDebugInfo(prev => ({ ...prev, schemaCheckException: err }));
      alert('Error checking schema. Check console for details.');
    }
  };

  // Check RLS policies
  const checkRLSPolicies = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      
      console.log('Checking RLS policies...');
      
      // Query to get RLS policy information
      const { data, error } = await supabase
        .rpc('get_table_policies', { table_name: 'products' });
      
      console.log('RLS policy check result:', { data, error });
      
      if (error) {
        console.error('Error checking RLS policies:', error);
        setDebugInfo(prev => ({ ...prev, rlsPolicyCheckError: error }));
        alert('Error checking RLS policies. Check console for details.');
      } else {
        setDebugInfo(prev => ({ ...prev, rlsPolicyInfo: data }));
        alert('RLS policy check completed! Check console for details.');
      }
    } catch (err) {
      console.error('Error checking RLS policies:', err);
      setDebugInfo(prev => ({ ...prev, rlsPolicyCheckException: err }));
      alert('Error checking RLS policies. Check console for details.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Product Test</h1>
      
      {/* Formulier */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Nieuw Product Toevoegen</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Product succesvol toegevoegd!
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-1">Naam *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as ProductType})}
                className="w-full p-2 border rounded"
              >
                <option value="saas">SaaS</option>
                <option value="hardware">Hardware</option>
                <option value="service">Service</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Prijs (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price === 0 ? '' : formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Verplicht</label>
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData({...formData, is_required: e.target.checked})}
                className="p-2 border rounded"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-1">Omschrijving</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Product Toevoegen
            </button>
            
            <button
              type="button"
              onClick={testDirectQuery}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Direct Query
            </button>
            
            <button
              type="button"
              onClick={testRLSPolicies}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Test RLS Policies
            </button>
            
            <button
              type="button"
              onClick={testMinimalProduct}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Test Minimal Product
            </button>
            
            <button
              type="button"
              onClick={checkDatabaseSchema}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Check Schema
            </button>
            
            <button
              type="button"
              onClick={checkRLSPolicies}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Check RLS Policies
            </button>
          </div>
        </form>
      </div>
      
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verplicht</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Omschrijving</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.type === 'saas' ? 'bg-blue-100 text-blue-800' : 
                        product.type === 'hardware' ? 'bg-green-100 text-green-800' : 
                        product.type === 'service' ? 'bg-purple-100 text-purple-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      €{product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.is_required ? 'Ja' : 'Nee'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Debug Info */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Debug Info</h3>
        <pre className="text-xs overflow-auto p-2 bg-gray-200 rounded">
          {JSON.stringify({ products, loading, error, formData, debugInfo }, null, 2)}
        </pre>
      </div>
    </div>
  );
} 