'use client';

import React from 'react';
import { ChartBarIcon, TableCellsIcon, ChartPieIcon } from '@heroicons/react/24/outline';

export type ViewType = 'summary' | 'table' | 'charts';

interface TabViewProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function TabView({ activeView, onViewChange }: TabViewProps) {
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex" aria-label="Tabs">
          <button
            onClick={() => onViewChange('summary')}
            className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
              activeView === 'summary'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartPieIcon className={`mr-2 h-5 w-5 ${activeView === 'summary' ? 'text-indigo-500' : 'text-gray-400'}`} />
            Samenvatting
          </button>
          
          <button
            onClick={() => onViewChange('table')}
            className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
              activeView === 'table'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TableCellsIcon className={`mr-2 h-5 w-5 ${activeView === 'table' ? 'text-indigo-500' : 'text-gray-400'}`} />
            Tabelweergave
          </button>
          
          <button
            onClick={() => onViewChange('charts')}
            className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
              activeView === 'charts'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartBarIcon className={`mr-2 h-5 w-5 ${activeView === 'charts' ? 'text-indigo-500' : 'text-gray-400'}`} />
            Grafiekweergave
          </button>
        </nav>
      </div>
    </div>
  );
} 