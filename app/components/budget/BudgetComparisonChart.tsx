'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface YearlyComparisonData {
  category: string;
  currentYear: number;
  previousYear: number;
  growth: number;
}

interface BudgetComparisonChartProps {
  data: YearlyComparisonData[];
  currentYear: number;
  previousYear: number;
  type: 'revenue' | 'expenses';
}

export default function BudgetComparisonChart({ 
  data, 
  currentYear, 
  previousYear,
  type
}: BudgetComparisonChartProps) {
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentYearValue = payload[0].value;
      const previousYearValue = payload[1].value;
      const growthPercentage = ((currentYearValue - previousYearValue) / previousYearValue) * 100;
      
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            {currentYear}: {formatCurrency(currentYearValue)}
          </p>
          <p className="text-sm text-gray-600">
            {previousYear}: {formatCurrency(previousYearValue)}
          </p>
          <p className={`text-sm font-medium ${growthPercentage >= 0 ? 
            (type === 'revenue' ? 'text-green-600' : 'text-red-600') : 
            (type === 'revenue' ? 'text-red-600' : 'text-green-600')}`}>
            Verschil: {growthPercentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Begroting Vergelijking {type === 'revenue' ? 'Inkomsten' : 'Uitgaven'} {previousYear} vs {currentYear}
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={formatYAxis} />
            <YAxis dataKey="category" type="category" width={150} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="currentYear" name={`${currentYear}`} fill="#3B82F6" />
            <Bar dataKey="previousYear" name={`${previousYear}`} fill="#9CA3AF" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 