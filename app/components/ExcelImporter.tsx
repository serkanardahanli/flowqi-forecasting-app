'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Database } from '@/types/supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type GlAccount = Database['public']['Tables']['gl_accounts']['Insert'];

interface ExcelImporterProps {
  onImportComplete: () => void;
  onError: (error: string) => void;
}

/**
 * Component voor het importeren van grootboekrekeningen uit een Excel bestand
 * Ondersteunt Exact Online export formaat
 */
export default function ExcelImporter({ onImportComplete, onError }: ExcelImporterProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{
    total: number;
    imported: number;
    errors: number;
  } | null>(null);
  
  const supabase = createClientComponentClient<Database>();

  // Helpt bij het bepalen van het GL-account niveau op basis van het rekeningnummer
  const determineLevel = (code: string): number => {
    // Controleren of de code een geldig formaat heeft (bijv. 4300, 4310, 4311)
    if (!code || typeof code !== 'string' || !/^\d+$/.test(code)) {
      return 1; // Default naar hoofdgroep bij ongeldig formaat
    }
    
    code = code.trim();
    
    // Logica voor het bepalen van het niveau:
    // - Niveau 1 (Hoofdgroep): 4000, 4100, 4200, etc. (eindigt op 00)
    // - Niveau 2 (Subgroep): 4010, 4020, 4110, etc. (eindigt op 0, maar niet op 00)
    // - Niveau 3 (Kostenpost): 4011, 4021, 4111, etc. (eindigt niet op 0)
    
    if (code.endsWith('00')) {
      return 1; // Hoofdgroep
    } else if (code.endsWith('0')) {
      return 2; // Subgroep
    } else {
      return 3; // Kostenpost
    }
  };

  // Bepaalt de parent_code op basis van niveau en code
  const determineParentCode = (code: string, level: number): string | null => {
    if (level === 1 || !code || typeof code !== 'string') {
      return null; // Hoofdgroepen hebben geen parent
    }
    
    code = code.trim();
    
    if (level === 2) {
      // Voor niveau 2 (bijv. 4310), parent is 4300
      return code.substring(0, 2) + '00';
    } else if (level === 3) {
      // Voor niveau 3 (bijv. 4311), parent is 4310
      return code.substring(0, 3) + '0';
    }
    
    return null;
  };

  // Bepaalt het type (Inkomsten/Uitgaven) op basis van het rekeningnummer
  const determineType = (code: string, winstverlies: string, debetCredit: string): 'Inkomsten' | 'Uitgaven' | 'Balans' => {
    // Default type op basis van rekeningnummer
    if (code.startsWith('8') || code.startsWith('9')) {
      return 'Inkomsten';
    }
    if (code.startsWith('4') || code.startsWith('5') || code.startsWith('6') || code.startsWith('7')) {
      return 'Uitgaven';
    }
    
    // Als winstverlies en debetCredit beschikbaar zijn, deze gebruiken voor nauwkeurigere bepaling
    if (winstverlies === 'Winst & Verlies') {
      if (debetCredit === 'Debet') {
        return 'Uitgaven';
      } else if (debetCredit === 'Credit') {
        return 'Inkomsten';
      }
    }
    
    return 'Balans';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setIsImporting(true);
    setImportStats(null);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
      
      // Controleer of de gegevens het verwachte formaat hebben
      if (jsonData.length === 0) {
        throw new Error('Het Excel bestand bevat geen gegevens');
      }
      
      // Verwerk de gegevens
      await processGlAccounts(jsonData);
      
    } catch (error) {
      console.error('Error importing file:', error);
      onError(error instanceof Error ? error.message : 'Er is een fout opgetreden bij het importeren');
      setIsImporting(false);
    }
  };
  
  const getOrganizationId = async (): Promise<string> => {
    // Haal de huidige gebruiker op
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      throw new Error('Je moet ingelogd zijn om grootboekrekeningen te importeren');
    }
    
    // Zoek de organisatie van de gebruiker
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();
      
    if (profileError || !profileData?.organization_id) {
      throw new Error('Geen organisatie gevonden voor deze gebruiker');
    }
    
    return profileData.organization_id;
  };

  const processGlAccounts = async (jsonData: any[]) => {
    const importStats = {
      total: jsonData.length,
      imported: 0,
      errors: 0
    };
    
    try {
      const organizationId = await getOrganizationId();
      
      // Converteer Excel rijen naar GL account objecten
      const glAccounts: GlAccount[] = [];
      
      for (const row of jsonData) {
        try {
          // Bepaal velden uit Excel
          const code = String(row['Code'] || row['Rekening'] || '').trim();
          if (!code) continue; // Sla rijen zonder code over
          
          const name = String(row['Omschrijving'] || row['Naam'] || '').trim();
          const balansType = String(row['Balans / Winst & Verlies'] || 'Winst & Verlies').trim();
          const debetCredit = String(row['Debet / Credit'] || 'Debet').trim();
          const blocked = row['Geblokkeerd'] === 'Ja';
          const compressed = row['Comprimeren'] === 'Ja';
          
          // Bepaal niveau en parent
          const level = determineLevel(code);
          const parentCode = determineParentCode(code, level);
          const type = determineType(code, balansType, debetCredit);
          
          // Maak GL account object
          const glAccount: GlAccount = {
            organization_id: organizationId,
            code: code,
            name: name,
            level: level,
            parent_code: parentCode,
            type: type,
            category: row['Rubriek'] || null,
            balans_type: balansType === 'Balans' ? 'Balans' : 'Winst & Verlies',
            debet_credit: debetCredit === 'Credit' ? 'Credit' : 'Debet',
            is_blocked: blocked,
            is_compressed: compressed
          };
          
          glAccounts.push(glAccount);
          importStats.imported++;
        } catch (error) {
          console.error('Error processing row:', row, error);
          importStats.errors++;
        }
      }
      
      // Importeer GL accounts naar Supabase
      // We importeren in batches van 50 om time-outs te voorkomen
      const batchSize = 50;
      for (let i = 0; i < glAccounts.length; i += batchSize) {
        const batch = glAccounts.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('gl_accounts')
          .upsert(batch, { 
            onConflict: 'organization_id,code',
            ignoreDuplicates: false
          });
          
        if (error) {
          console.error('Error importing batch:', error);
          throw error;
        }
      }
      
      setImportStats(importStats);
      onImportComplete();
    } catch (error) {
      console.error('Error processing GL accounts:', error);
      onError(error instanceof Error ? error.message : 'Er is een fout opgetreden bij het verwerken van de gegevens');
      setImportStats(importStats);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="excel-upload"
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
            isImporting ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-300 hover:border-indigo-500 hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isImporting ? (
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto text-gray-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-sm text-gray-500">Bezig met importeren...</p>
              </div>
            ) : (
              <>
                <svg className="w-8 h-8 mb-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Klik om een bestand te kiezen</span> of sleep een bestand hierheen
                </p>
                <p className="text-xs text-gray-500">Excel (.xlsx, .xls)</p>
              </>
            )}
          </div>
          <input 
            id="excel-upload" 
            type="file" 
            className="hidden"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            disabled={isImporting}
          />
        </label>
      </div>
      
      {fileName && (
        <div className="text-sm">
          <p className="text-gray-500">Bestand: <span className="font-medium text-gray-700">{fileName}</span></p>
        </div>
      )}

      {importStats && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">Import resultaat</h3>
          <div className="mt-2 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Totaal</p>
              <p className="text-xl font-semibold text-gray-700">{importStats.total}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Geïmporteerd</p>
              <p className="text-xl font-semibold text-green-600">{importStats.imported}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Fouten</p>
              <p className="text-xl font-semibold text-red-600">{importStats.errors}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 