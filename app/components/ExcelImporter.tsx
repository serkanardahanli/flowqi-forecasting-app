"use client";

import { useState, useRef } from 'react';
import { X, FileUp, Check, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import type { Database } from '@/types/supabase';

// Interface voor de properties van de component
interface ExcelImporterProps {
  onSuccess?: (data: any[]) => void;
  onError?: (error: string) => void;
  tableName: string;
  allowedColumns: string[];
  requiredColumns: string[];
  transformData?: (data: any[]) => any[];
}

// De Excel Importer component
export default function ExcelImporter({
  onSuccess,
  onError,
  tableName,
  allowedColumns,
  requiredColumns,
  transformData
}: ExcelImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Functie om het bestand te selecteren
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  };

  // Functie om het bestand te verwijderen
  const handleRemoveFile = () => {
    setFile(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Functie om het bestand te verwerken en uploaden
  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('Geen bestand geselecteerd.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Lees het Excel bestand
      const data = await readExcelFile(file);
      
      if (data.length === 0) {
        throw new Error('Het Excel bestand bevat geen gegevens.');
      }

      // Controleer of de vereiste kolommen aanwezig zijn
      const firstRow = data[0];
      const columns = Object.keys(firstRow);
      
      for (const required of requiredColumns) {
        if (!columns.includes(required)) {
          throw new Error(`Vereiste kolom "${required}" ontbreekt in het Excel bestand.`);
        }
      }

      // Filter op toegestane kolommen
      const filteredData = data.map(row => {
        const filteredRow: any = {};
        for (const key of Object.keys(row)) {
          if (allowedColumns.includes(key)) {
            filteredRow[key] = row[key];
          }
        }
        return filteredRow;
      });

      // Transformeer data indien nodig
      const processedData = transformData ? transformData(filteredData) : filteredData;

      // Upload naar Supabase
      const supabase = getBrowserSupabaseClient();
      
      const { error } = await supabase
        .from(tableName)
        .insert(processedData);

      if (error) throw error;

      setSuccessMessage(`${processedData.length} regels succesvol geïmporteerd!`);
      if (onSuccess) onSuccess(processedData);
    } catch (error) {
      console.error('Excel import error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Er is een fout opgetreden bij het importeren.';
      setErrorMessage(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // Functie om een Excel bestand te lezen
  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Kan het Excel bestand niet verwerken.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Er is een fout opgetreden bij het lezen van het bestand.'));
      };
      
      reader.readAsBinaryString(file);
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Excel Importeren</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label 
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FileUp className="w-8 h-8 mb-3 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Klik om een bestand te uploaden</span> of sleep het hierheen
              </p>
              <p className="text-xs text-gray-500">
                XLSX, XLS (MAX. 10MB)
              </p>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".xlsx,.xls" 
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
        
        {file && (
          <div className="flex items-center p-2 bg-blue-50 rounded">
            <div className="flex-1 truncate">
              <span className="font-medium text-blue-700">{file.name}</span>
              <span className="ml-2 text-xs text-blue-500">({(file.size / 1024).toFixed(2)} KB)</span>
            </div>
            <button 
              onClick={handleRemoveFile}
              className="p-1 ml-2 text-red-600 rounded hover:bg-red-100"
              disabled={isUploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {errorMessage && (
          <div className="p-3 text-sm bg-red-50 text-red-700 rounded flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="p-3 text-sm bg-green-50 text-green-700 rounded flex items-start">
            <Check className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`px-4 py-2 text-white rounded-lg ${
              !file || isUploading 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isUploading ? 'Uploaden...' : 'Importeren'}
          </button>
        </div>
      </div>
    </div>
  );
} 