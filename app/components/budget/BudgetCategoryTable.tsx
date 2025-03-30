'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string;
  code: string;
  name: string;
  amount: number;
  level: number;
  children?: Category[];
  parent_code?: string;
}

interface BudgetCategoryTableProps {
  title: string;
  categories: Category[];
  year: number;
}

export default function BudgetCategoryTable({ title, categories, year }: BudgetCategoryTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (code: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryRow = (
    category: Category, 
    depth: number = 0,
    isLastInGroup: boolean = false
  ) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.code);
    const paddingLeft = `${depth * 1.5 + 0.75}rem`;
    
    return (
      <React.Fragment key={category.id}>
        <tr 
          className={`${depth === 0 ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50'} cursor-pointer`}
          onClick={() => hasChildren && toggleCategory(category.code)}
        >
          <td className="px-4 py-2 whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft }}>
              {hasChildren && (
                <span className="mr-1">
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                  )}
                </span>
              )}
              <span className="text-sm">{category.code}</span>
            </div>
          </td>
          <td className="px-4 py-2 whitespace-nowrap">
            <div style={{ paddingLeft: hasChildren ? 0 : paddingLeft }}>
              <span className="text-sm">{category.name}</span>
            </div>
          </td>
          <td className="px-4 py-2 text-right whitespace-nowrap">
            <span className={`text-sm ${depth === 0 ? 'font-medium' : ''}`}>
              {formatCurrency(category.amount)}
            </span>
          </td>
        </tr>
        
        {isExpanded && hasChildren && category.children?.map((child, index) => 
          renderCategoryRow(
            child, 
            depth + 1, 
            index === (category.children?.length || 0) - 1
          )
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {title} {year}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ width: '15%' }}
              >
                Code
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Categorie
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ width: '20%' }}
              >
                Bedrag
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => renderCategoryRow(category))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 