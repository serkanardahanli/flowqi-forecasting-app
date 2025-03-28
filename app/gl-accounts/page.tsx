'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/app/hooks/useSupabase';
import MainLayout from '@/app/components/MainLayout';
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { Database } from '@/types/supabase';
import ExcelImporter from '@/app/components/ExcelImporter';
import { getOrganizationId, ensureClientUserProfile } from '@/app/utils/auth';

type GlAccount = Database['public']['Tables']['gl_accounts']['Row'];

type GlAccountFormData = {
  code: string;
  name: string;
  parent_code: string;
  level: number;
  category: string;
  type: 'Inkomsten' | 'Uitgaven' | 'Balans';
  balans_type: 'Winst & Verlies' | 'Balans';
  debet_credit: 'Debet' | 'Credit';
  is_blocked: boolean;
  is_compressed: boolean;
};

export default function GlAccountsPage() {
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formData, setFormData] = useState<GlAccountFormData>({
    code: '',
    name: '',
    parent_code: '',
    level: 1,
    category: '',
    type: 'Uitgaven',
    balans_type: 'Winst & Verlies',
    debet_credit: 'Debet',
    is_blocked: false,
    is_compressed: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const { supabase } = useSupabase();

  // Fetch GL accounts
  const fetchGlAccounts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!session) {
        window.location.href = '/auth/signin';
        return;
      }

      // Ensure user profile is properly set up
      await ensureClientUserProfile(session.user.id);

      const organizationId = await getOrganizationId();
      console.log('Fetching GL accounts for organization:', organizationId);

      const { data, error } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('code');
      
      if (error) throw error;
      
      setGlAccounts(data || []);
    } catch (error) {
      console.error('Error in fetchGlAccounts:', error);
      setError(error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGlAccounts();
  }, []);

  // Reset form helper
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      parent_code: '',
      level: 1,
      category: '',
      type: 'Uitgaven',
      balans_type: 'Winst & Verlies',
      debet_credit: 'Debet',
      is_blocked: false,
      is_compressed: false
    });
    setShowModal(false);
    setIsEditing(false);
    setEditId(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!session) {
        window.location.href = '/auth/signin';
        return;
      }

      // Ensure user profile is properly set up
      await ensureClientUserProfile(session.user.id);

      const organizationId = await getOrganizationId();
      console.log('Saving GL account for organization:', organizationId);
      
      if (isEditing && editId) {
        const { error } = await supabase
          .from('gl_accounts')
          .update({...formData, organization_id: organizationId})
          .eq('id', editId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gl_accounts')
          .insert([{...formData, organization_id: organizationId}]);
        
        if (error) throw error;
      }
      
      resetForm();
      await fetchGlAccounts();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden');
    }
  };

  // Handle edit button click
  const handleEdit = (account: GlAccount) => {
    setFormData({
      code: account.code,
      name: account.name,
      parent_code: account.parent_code || '',
      level: account.level,
      category: account.category || '',
      type: account.type,
      balans_type: account.balans_type,
      debet_credit: account.debet_credit,
      is_blocked: account.is_blocked,
      is_compressed: account.is_compressed
    });
    setIsEditing(true);
    setEditId(account.id);
    setShowModal(true);
  };

  // Handle delete button click
  const handleDelete = async (id: string) => {
    if (window.confirm('Weet je zeker dat je deze grootboekrekening wilt verwijderen?')) {
      try {
        const { error } = await supabase
          .from('gl_accounts')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Refresh GL accounts list
        await fetchGlAccounts();
      } catch (error) {
        console.error('Error deleting GL account:', error);
        setError(error instanceof Error ? error.message : 'Er is een onverwachte fout opgetreden');
      }
    }
  };

  // Get parent account options for dropdown
  const getParentOptions = () => {
    return glAccounts
      .filter(account => account.level === 1)
      .map(account => ({
        value: account.code,
        label: `${account.code} - ${account.name}`
      }));
  };

  // Get subgroep account options for dropdown
  const getSubgroepOptions = () => {
    return glAccounts
      .filter(account => account.level === 2)
      .map(account => ({
        value: account.code,
        label: `${account.code} - ${account.name}`
      }));
  };

  // Handle form field changes
  const handleFormChange = (
    field: keyof GlAccountFormData,
    value: string | number | boolean
  ) => {
    if (field === 'type') {
      setFormData(prev => ({ ...prev, type: value as GlAccountFormData['type'] }));
    } else if (field === 'balans_type') {
      setFormData(prev => ({ ...prev, balans_type: value as GlAccountFormData['balans_type'] }));
    } else if (field === 'debet_credit') {
      setFormData(prev => ({ ...prev, debet_credit: value as GlAccountFormData['debet_credit'] }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1E1E3F]">Grootboekrekeningen</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-[#3B3B7C] text-white rounded-md hover:bg-[#4D4DA5] inline-flex items-center"
            >
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              Importeren
            </button>
            <button
              onClick={() => {
                setFormData({
                  code: '',
                  name: '',
                  parent_code: '',
                  level: 1,
                  category: '',
                  type: 'Uitgaven',
                  balans_type: 'Winst & Verlies',
                  debet_credit: 'Debet',
                  is_blocked: false,
                  is_compressed: false
                });
                setIsEditing(false);
                setEditId(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-[#1E1E3F] text-white rounded-md hover:bg-[#3B3B7C] inline-flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nieuwe grootboekrekening
            </button>
          </div>
        </div>

        {/* GL Accounts Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-[#1E1E3F]">Overzicht grootboekrekeningen</h2>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}
            
            {isLoading ? (
              <div className="text-center py-10">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1E1E3F] border-r-transparent"></div>
                <p className="mt-4 text-gray-500">Grootboekrekeningen laden...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Naam
                      </th>
                      <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Niveau
                      </th>
                      <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categorie
                      </th>
                      <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Balans Type
                      </th>
                      <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Debet/Credit
                      </th>
                      <th className="px-3 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {glAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                          Geen grootboekrekeningen gevonden. Klik op "Nieuwe grootboekrekening" om er een toe te voegen.
                        </td>
                      </tr>
                    ) : (
                      glAccounts.map((account) => (
                        <tr key={account.id} className={account.level === 1 ? "bg-gray-50" : ""}>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {account.code}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {account.name}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {account.level === 1 ? "Hoofdgroep" : account.level === 2 ? "Subgroep" : "Kostenpost"}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {account.category}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {account.type}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {account.balans_type}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {account.debet_credit}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            <button
                              onClick={() => handleEdit(account)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(account.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal for adding/editing GL accounts */}
        {showModal && (
          <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="relative bg-[#1E1E3F] text-white rounded-lg max-w-lg w-full mx-auto p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">
                  {isEditing ? 'Grootboekrekening bewerken' : 'Nieuwe grootboekrekening'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-300 hover:text-white"
                >
                  <span className="sr-only">Sluiten</span>
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-200">
                      Code
                    </label>
                    <input
                      type="text"
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleFormChange('code', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-200">
                      Naam
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="level" className="block text-sm font-medium text-gray-200">
                      Niveau
                    </label>
                    <select
                      id="level"
                      value={formData.level}
                      onChange={(e) => handleFormChange('level', Number(e.target.value))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value={1}>Hoofdgroep</option>
                      <option value={2}>Subgroep</option>
                      <option value={3}>Kostenpost</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="parent_code" className="block text-sm font-medium text-gray-200">
                      {formData.level === 2 ? 'Hoofdgroep' : formData.level === 3 ? 'Subgroep' : ''}
                    </label>
                    {formData.level === 1 ? (
                      <input
                        type="text"
                        value="Geen (dit is een hoofdgroep)"
                        disabled
                        className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-gray-400 rounded-md shadow-sm sm:text-sm"
                      />
                    ) : formData.level === 2 ? (
                      <select
                        id="parent_code"
                        value={formData.parent_code}
                        onChange={(e) => handleFormChange('parent_code', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      >
                        <option value="">Selecteer een hoofdgroep</option>
                        {getParentOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        id="parent_code"
                        value={formData.parent_code}
                        onChange={(e) => handleFormChange('parent_code', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      >
                        <option value="">Selecteer een subgroep</option>
                        {getSubgroepOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-200">
                      Categorie
                    </label>
                    <input
                      type="text"
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-200">
                      Type
                    </label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => handleFormChange('type', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="Inkomsten">Inkomsten</option>
                      <option value="Uitgaven">Uitgaven</option>
                      <option value="Balans">Balans</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="balans_type" className="block text-sm font-medium text-gray-200">
                      Balans Type
                    </label>
                    <select
                      id="balans_type"
                      value={formData.balans_type}
                      onChange={(e) => handleFormChange('balans_type', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="Winst & Verlies">Winst & Verlies</option>
                      <option value="Balans">Balans</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="debet_credit" className="block text-sm font-medium text-gray-200">
                      Debet/Credit
                    </label>
                    <select
                      id="debet_credit"
                      value={formData.debet_credit}
                      onChange={(e) => handleFormChange('debet_credit', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-[#2D2D5F] text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="Debet">Debet</option>
                      <option value="Credit">Credit</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center mt-4 space-x-4">
                  <label className="flex items-center text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.is_blocked}
                      onChange={(e) => handleFormChange('is_blocked', e.target.checked)}
                      className="h-4 w-4 bg-[#2D2D5F] text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded"
                    />
                    <span className="ml-2">Geblokkeerd</span>
                  </label>
                  <label className="flex items-center text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.is_compressed}
                      onChange={(e) => handleFormChange('is_compressed', e.target.checked)}
                      className="h-4 w-4 bg-[#2D2D5F] text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded"
                    />
                    <span className="ml-2">Gecomprimeerd</span>
                  </label>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isEditing ? 'Opslaan' : 'Toevoegen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Excel import */}
        {showImportModal && (
          <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full mx-auto p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Grootboekrekeningen importeren
                </h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportError(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">Sluiten</span>
                  &times;
                </button>
              </div>
              
              {importError && (
                <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
                  {importError}
                </div>
              )}
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Upload een Excel-bestand met grootboekrekeningen. Het systeem ondersteunt het Exact Online exportformaat.
                  De volgende velden worden geïmporteerd:
                </p>
                <ul className="mt-2 ml-5 list-disc text-sm text-gray-500">
                  <li>Code / Rekening</li>
                  <li>Omschrijving / Naam</li>
                  <li>Rubriek</li>
                  <li>Balans / Winst & Verlies</li>
                  <li>Debet / Credit</li>
                  <li>Geblokkeerd</li>
                  <li>Comprimeren</li>
                </ul>
              </div>
              
              <ExcelImporter 
                onImportComplete={() => {
                  setShowImportModal(false);
                  fetchGlAccounts();
                }}
                onError={setImportError}
              />
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportError(null);
                  }}
                  className="px-4 py-2 bg-gray-200 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 