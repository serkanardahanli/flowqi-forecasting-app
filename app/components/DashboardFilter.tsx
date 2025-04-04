'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Period } from '@/app/types/period';

interface DashboardFilterProps {
  onFilterChange: (period: Period, year: number) => void;
  initialPeriod?: Period;
  initialYear?: number;
}

export default function DashboardFilter({ onFilterChange, initialPeriod, initialYear }: DashboardFilterProps) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JS months are 0-indexed

  // Define period options
  const periods: Period[] = [
    { label: 'Huidige maand', value: 'current', dateRange: { startMonth: currentMonth, endMonth: currentMonth } },
    { label: 'Januari', value: 'jan', dateRange: { startMonth: 1, endMonth: 1 } },
    { label: 'Februari', value: 'feb', dateRange: { startMonth: 2, endMonth: 2 } },
    { label: 'Maart', value: 'mar', dateRange: { startMonth: 3, endMonth: 3 } },
    { label: 'April', value: 'apr', dateRange: { startMonth: 4, endMonth: 4 } },
    { label: 'Mei', value: 'may', dateRange: { startMonth: 5, endMonth: 5 } },
    { label: 'Juni', value: 'jun', dateRange: { startMonth: 6, endMonth: 6 } },
    { label: 'Juli', value: 'jul', dateRange: { startMonth: 7, endMonth: 7 } },
    { label: 'Augustus', value: 'aug', dateRange: { startMonth: 8, endMonth: 8 } },
    { label: 'September', value: 'sep', dateRange: { startMonth: 9, endMonth: 9 } },
    { label: 'Oktober', value: 'oct', dateRange: { startMonth: 10, endMonth: 10 } },
    { label: 'November', value: 'nov', dateRange: { startMonth: 11, endMonth: 11 } },
    { label: 'December', value: 'dec', dateRange: { startMonth: 12, endMonth: 12 } },
    { label: 'Q1', value: 'q1', dateRange: { startMonth: 1, endMonth: 3 } },
    { label: 'Q2', value: 'q2', dateRange: { startMonth: 4, endMonth: 6 } },
    { label: 'Q3', value: 'q3', dateRange: { startMonth: 7, endMonth: 9 } },
    { label: 'Q4', value: 'q4', dateRange: { startMonth: 10, endMonth: 12 } },
    { label: 'H1', value: 'h1', dateRange: { startMonth: 1, endMonth: 6 } },
    { label: 'H2', value: 'h2', dateRange: { startMonth: 7, endMonth: 12 } },
    { label: 'Jaar totaal', value: 'year', dateRange: { startMonth: 1, endMonth: 12 } },
  ];

  const [selectedPeriod, setSelectedPeriod] = useState<Period>(initialPeriod || periods[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(initialYear || currentYear);

  // Year options (current year and previous years)
  const yearOptions = [
    currentYear,
    currentYear - 1,
    currentYear - 2
  ];

  // When component mounts, set the default period to current month
  useEffect(() => {
    onFilterChange(selectedPeriod, selectedYear);
  }, []);

  const handlePeriodSelect = (period: Period) => {
    setSelectedPeriod(period);
    setIsOpen(false);
    onFilterChange(period, selectedYear);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    onFilterChange(selectedPeriod, year);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Period selector */}
      <div className="relative">
        <button
          type="button"
          className="inline-flex items-center justify-between w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selectedPeriod.label}</span>
          <ChevronDownIcon className="h-5 w-5 ml-2" />
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            <div className="p-2 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-2">Maanden</div>
              {periods.slice(1, 13).map((period) => (
                <div
                  key={period.value}
                  className={`cursor-pointer select-none px-4 py-2 text-sm rounded-md ${
                    selectedPeriod.value === period.value
                      ? 'bg-indigo-100 text-indigo-900'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => handlePeriodSelect(period)}
                >
                  {period.label}
                </div>
              ))}
            </div>
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2">Periodes</div>
              {periods.slice(0, 1).concat(periods.slice(13)).map((period) => (
                <div
                  key={period.value}
                  className={`cursor-pointer select-none px-4 py-2 text-sm rounded-md ${
                    selectedPeriod.value === period.value
                      ? 'bg-indigo-100 text-indigo-900'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => handlePeriodSelect(period)}
                >
                  {period.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Year selector */}
      <div>
        <select
          value={selectedYear}
          onChange={(e) => handleYearChange(parseInt(e.target.value))}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 