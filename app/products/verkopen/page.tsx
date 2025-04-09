"use client";

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import Link from 'next/link';

export default function VerkoopBeheer() {
  const [products, setProducts] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [plannedData, setPlannedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM formaat
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isPlanned, setIsPlanned] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 0,
    revenue: 0,
    cost: 0,
    profit: 0
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProducts(),
          fetchSalesData()
        ]);
      } catch (err) {
        setError("Er is een fout opgetreden bij het laden van de gegevens.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedPeriod]);

  const fetchProducts = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          gl_account:gl_account_id(name, code, level)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Filter alleen niveau 3 grootboekrekeningen (eindrekeningen)
      const filteredProducts = data?.filter(product => 
        product.gl_account && 
        product.gl_account.level === 3 && 
        ['8011', '8012', '8021', '8022', '8023'].includes(product.gl_account.code)
      ) || [];
      
      setProducts(filteredProducts);
      return filteredProducts;
    } catch (err) {
      console.error('Error fetching products:', err);
      throw err;
    }
  };

  const fetchSalesData = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Haal de jaar en maand uit de periode (YYYY-MM)
      const [year, month] = selectedPeriod.split('-').map(Number);
      
      // Haal werkelijke verkoopgegevens op
      const { data: salesData, error: salesError } = await supabase
        .from('sales_data')
        .select(`
          *,
          product:product_id(name, code)
        `)
        .eq('period', selectedPeriod);
      
      if (salesError) throw salesError;
      
      // Haal geplande verkoopgegevens op
      const { data: plannedData, error: plannedError } = await supabase
        .from('planned_sales')
        .select(`
          *,
          product:product_id(name, code)
        `)
        .eq('period', selectedPeriod);
      
      if (plannedError) throw plannedError;
      
      setSalesData(salesData || []);
      setPlannedData(plannedData || []);
      
      return { salesData, plannedData };
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setSalesData([]);
      setPlannedData([]);
      return { salesData: [], plannedData: [] };
    }
  };

  const handleProductSelect = (productId) => {
    setSelectedProduct(productId);
    
    // Reset form data
    setFormData({
      quantity: 0,
      revenue: 0,
      cost: 0,
      profit: 0
    });
    
    // Check if there's existing data for this product and period
    const existingData = isPlanned
      ? plannedData.find(item => item.product_id === productId)
      : salesData.find(item => item.product_id === productId);
    
    if (existingData) {
      setFormData({
        quantity: existingData.quantity,
        revenue: existingData.revenue,
        cost: existingData.cost,
        profit: existingData.profit
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: numValue };
      
      // Automatisch winst berekenen als quantity, revenue en cost zijn ingevuld
      if (name === 'quantity' || name === 'revenue' || name === 'cost') {
        newData.profit = newData.revenue - newData.cost;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      setError("Selecteer eerst een product.");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const supabase = getBrowserSupabaseClient();
      
      // Haal de jaar en maand uit de periode (YYYY-MM)
      const [year, month] = selectedPeriod.split('-').map(Number);
      const quarter = Math.ceil(month / 3);
      
      const data = {
        product_id: selectedProduct,
        period: selectedPeriod,
        year,
        month,
        quarter,
        quantity: formData.quantity,
        revenue: formData.revenue,
        cost: formData.cost,
        profit: formData.profit
      };
      
      // Check if data already exists for this product and period
      const existingData = isPlanned
        ? plannedData.find(item => item.product_id === selectedProduct)
        : salesData.find(item => item.product_id === selectedProduct);
      
      let result;
      
      if (existingData) {
        // Update existing data
        result = await supabase
          .from(isPlanned ? 'planned_sales' : 'sales_data')
          .update(data)
          .eq('id', existingData.id);
      } else {
        // Insert new data
        result = await supabase
          .from(isPlanned ? 'planned_sales' : 'sales_data')
          .insert([data]);
      }
      
      if (result.error) throw result.error;
      
      setSuccessMessage(`Verkoopgegevens succesvol ${existingData ? 'bijgewerkt' : 'toegevoegd'}.`);
      
      // Refresh data
      fetchSalesData();
      
      // Reset form
      setSelectedProduct('');
      setFormData({
        quantity: 0,
        revenue: 0,
        cost: 0,
        profit: 0
      });
    } catch (err) {
      console.error('Error saving sales data:', err);
      setError(`Fout bij opslaan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, isPlannedData) => {
    if (!confirm('Weet je zeker dat je deze gegevens wilt verwijderen?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const supabase = getBrowserSupabaseClient();
      
      const { error } = await supabase
        .from(isPlannedData ? 'planned_sales' : 'sales_data')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSuccessMessage('Verkoopgegevens succesvol verwijderd.');
      
      // Refresh data
      fetchSalesData();
    } catch (err) {
      console.error('Error deleting sales data:', err);
      setError(`Fout bij verwijderen: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Verkoopgegevens Beheren</h1>
            <p className="text-gray-600">Voer verkoopgegevens in en beheer bestaande data</p>
          </div>
          <div className="flex space-x-2">
            <Link href="/products" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Terug naar Dashboard
            </Link>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
            <input 
              type="month" 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border rounded px-3 py-1 text-gray-700"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type Gegevens</label>
            <div className="flex">
              <button 
                className={`px-3 py-1 text-sm border ${!isPlanned ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-gray-300 text-gray-700'}`}
                onClick={() => setIsPlanned(false)}
              >
                Werkelijke Verkopen
              </button>
              <button 
                className={`px-3 py-1 text-sm border ${isPlanned ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-gray-300 text-gray-700'}`}
                onClick={() => setIsPlanned(true)}
              >
                Geplande Verkopen
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Formulier voor invoer */}
          <div className="bg-white p-4 rounded shadow mb-6">
            <h2 className="text-lg font-medium mb-4 text-gray-800">
              {isPlanned ? 'Geplande Verkopen Invoeren' : 'Werkelijke Verkopen Invoeren'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-gray-700"
                    required
                  >
                    <option value="">Selecteer een product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.gl_account?.code} - {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aantal</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 text-gray-700"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Omzet (€)</label>
                  <input
                    type="number"
                    name="revenue"
                    value={formData.revenue}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 text-gray-700"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kosten (€)</label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 text-gray-700"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Winst (€)</label>
                  <input
                    type="number"
                    name="profit"
                    value={formData.profit}
                    onChange={handleInputChange}
                    className="w-full border rounded px-3 py-2 text-gray-700 bg-gray-100"
                    min="0"
                    step="0.01"
                    readOnly
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={loading}
                >
                  {selectedProduct && (isPlanned 
                    ? plannedData.find(item => item.product_id === selectedProduct)
                    : salesData.find(item => item.product_id === selectedProduct))
                    ? 'Bijwerken' 
                    : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Overzicht van ingevoerde gegevens */}
          <div className="bg-white p-4 rounded shadow mb-6">
            <h2 className="text-lg font-medium mb-4 text-gray-800">
              Overzicht {isPlanned ? 'Geplande' : 'Werkelijke'} Verkopen voor {selectedPeriod}
            </h2>
            
            {(isPlanned ? plannedData : salesData).length === 0 ? (
              <p className="text-gray-600">Geen {isPlanned ? 'geplande' : 'werkelijke'} verkoopgegevens gevonden voor deze periode.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">GL Rekening</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Aantal</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Omzet (€)</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Kosten (€)</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Winst (€)</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Acties</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(isPlanned ? plannedData : salesData).map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800">{item.product?.name || 'Onbekend product'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800">
                          {item.product?.gl_account?.code || 'Geen GL rekening'}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap text-gray-800">{item.quantity}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap text-gray-800">{formatCurrency(item.revenue)}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap text-gray-800">{formatCurrency(item.cost)}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap text-gray-800">{formatCurrency(item.profit)}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(item.id, isPlanned)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Verwijderen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 