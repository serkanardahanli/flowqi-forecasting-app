'use client';

import React from 'react';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

export type ComparisonType = 'budget' | 'previous-year';

interface ComparisonSelectorProps {
  comparison: ComparisonType;
  onComparisonChange: (comparison: ComparisonType) => void;
}

export default function ComparisonSelector({
  comparison,
  onComparisonChange
}: ComparisonSelectorProps) {
  return (
    <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow border border-gray-200">
      <ArrowsRightLeftIcon className="h-5 w-5 text-indigo-600 mr-2" />
      <span className="font-medium text-gray-700 mr-2">Vergelijking:</span>
      <div className="inline-flex rounded-md shadow-sm">
        <button
          type="button"
          onClick={() => onComparisonChange('budget')}
          className={`px-3 py-1.5 text-sm font-medium rounded-l-md ${
            comparison === 'budget'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } border border-gray-300 transition-colors`}
        >
          Begroting
        </button>
        <button
          type="button"
          onClick={() => onComparisonChange('previous-year')}
          className={`px-3 py-1.5 text-sm font-medium rounded-r-md ${
            comparison === 'previous-year'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } border-t border-b border-r border-gray-300 transition-colors`}
        >
          Vorig Jaar
        </button>
      </div>
    </div>
  );
} 