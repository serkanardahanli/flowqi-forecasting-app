'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ExportButtonProps {
  onExport: (format?: 'excel' | 'pdf') => void;
}

export default function ExportButton({ onExport }: ExportButtonProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center bg-white px-4 py-2 rounded-lg shadow border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <ArrowDownTrayIcon className="h-5 w-5 text-indigo-600 mr-2" />
        <span className="font-medium">Exporteren</span>
        <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <button
              onClick={() => {
                onExport('excel');
                setDropdownOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <svg className="h-5 w-5 mr-2 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Excel</span>
            </button>
            <button
              onClick={() => {
                onExport('pdf');
                setDropdownOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <svg className="h-5 w-5 mr-2 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 